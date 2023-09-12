const { authenticate } = require('./auth');
const { getAllReloads } = require('./reload');

// Possible reload statusess as per https://qlik.dev/apis/rest/reloads#%23%2Fdefinitions%2FReloads
// There are seven statuses.
//  - QUEUED, RELOADING, CANCELING are the active statuses.
//  - SUCCEEDED, FAILED, CANCELED,EXCEEDED_LIMIT are the end statuses.
//
// QUEUED
// RELOADING
// CANCELING
// SUCCEEDED
// FAILED
// CANCELED
// EXCEEDED_LIMIT

// State machine to keep trackl of each reload the current user has access to
class ReloadStateMachine {
    constructor(node, updateInterval = 15000) {
        this.node = node; // Complete Node object
        this.config = node.config; // Node configuration
        this.reloads = new Map(); // Map to store reloads and their states
        this.updateTimer = null; // Timer to update the state machine every 15 seconds
        this.updateInterval = updateInterval; // Update interval in milliseconds
        this.tickTimer = null; // Interval to call the tick method every second
        this.updateIntervalSeconds = Math.round(updateInterval / 1000); // Update interval to seconds
        this.remainingSeconds = Math.round(updateInterval / 1000); // Remaining number of seconds until the next update
    }

    // Method to be called every second when the timer is running
    tick() {
        // Update remaining seconds
        this.remainingSeconds -= 1;

        // Update the node status with remaining number of seconds
        this.node.status({ fill: 'green', shape: 'dot', text: `update in ${this.remainingSeconds} seconds` });
    }

    // Add a new reload to the state machine
    addReload(reloadId, reloadObject) {
        // Debug
        this.node.log(`adding reload ${reloadId}`);

        this.reloads.set(reloadId, { status: reloadObject.status, prevStatus: null, reloadObject });

        // Send message to output 1
        const outMsg = {
            payload: {
                message: 'reload added',
                reloadId: reloadObject.id, // Reload ID
                reloadStatus: reloadObject.status, // Reload status
                reloadObject, // Reload object
            },
        };
        this.node.send([outMsg, null]);
    }

    // Update the status of a reload
    updateReload(reloadId, newStatus, reloadObject) {
        // Debug
        // this.node.log(`updating reload ${reloadId} to state ${newStatus}`);

        // Get reload object from state machine
        const reload = this.reloads.get(reloadId);

        // Send message if status has changed
        if (reload.status !== newStatus) {
            // Debug log. Reload id, current status and new status
            this.node.log(`reload ${reloadId} is in state ${reload.status}. Updating to state ${newStatus}`);

            const outMsg = {
                payload: {
                    message: 'reload status changed',
                    reloadId, // Reload ID
                    prevStatus: reload.status, // Previous reload status
                    reloadStatus: newStatus, // New reload status
                    reloadObject: reload.reloadObject, // Reload object
                },
            };
            this.node.send([outMsg, null]);
        }

        if (reload) {
            reload.prevStatus = reload.status;
            reload.status = newStatus;
            reload.reloadObject = reloadObject;
        }
    }

    // Delete a reload from the state machine
    deleteReload(reloadId) {
        // Debug
        this.node.log(`deleting reload ${reloadId}`);

        this.reloads.delete(reloadId);

        // Send message to output 1
        const outMsg = {
            payload: {
                message: 'reload deleted',
                reloadId,
            },
        };
        this.node.send([outMsg, null]);
    }

    // Get the entire state machine
    // Return array of reload objects
    getFullState() {
        // Debug
        this.node.log('get full state');

        const fullState = [];
        this.reloads.forEach((reload) => {
            fullState.push(reload.reloadObject);
        });

        return fullState;
    }

    // Start the timer to update the state machine at regular intervals
    startTimer() {
        // Only start the timer if it is not already running
        if (this.updateTimer !== null) {
            this.node.log('timer is already running');
            return;
        }
        this.node.log(`starting timer to update reload states every ${this.updateInterval} milliseconds`);
        this.updateTimer = setInterval(() => {
            this.updateReloadStates(this.node);
        }, this.updateInterval);

        // Start the tick interval to call the tick method every second
        // Only start the timer if it is not already running
        if (this.tickTimer) {
            this.node.log('tick timer is already running');
            return;
        }
        this.tickTimer = setInterval(() => {
            this.tick();
        }, 1000);

        // Reset number of remaining seconds
        this.remainingSeconds = this.updateIntervalSeconds;

        // Send message to output 2
        const outMsg = {
            payload: {
                message: 'Timer started',
            },
        };
        this.node.send([null, outMsg]);
    }

    // Stop the timer
    stopTimer() {
        if (!this.updateTimer) {
            this.node.log('update timer is not running');
            return;
        }

        if (!this.tickTimer) {
            this.node.log('tick timer is not running');
            return;
        }

        // Debug
        this.node.log('stopping timer to update reload states');

        clearInterval(this.updateTimer);
        clearInterval(this.tickTimer);

        this.updateTimer = null;
        this.tickTimer = null;

        // Send message to output 2
        const outMsg = {
            payload: {
                message: 'Timer stopped',
            },
        };
        this.node.send([null, outMsg]);
    }

    // Set update interval in milliseconds
    setUpdateInterval(updateInterval) {
        // Debug
        this.node.log(`setting update interval to ${updateInterval} milliseconds`);

        this.stopTimer();

        this.updateInterval = updateInterval;
        this.updateIntervalSeconds = Math.round(updateInterval / 1000);

        // Reset number of remaining seconds
        this.remainingSeconds = this.updateIntervalSeconds;

        this.startTimer();

        // Send message to output 2
        const outMsg = {
            payload: {
                message: 'update interval set',
                updateInterval: this.updateInterval,
                updateIntervalSeconds: this.updateIntervalSeconds,
            },
        };
        this.node.send([null, outMsg]);

        return { updateInterval: this.updateInterval, updateIntervalSeconds: this.updateIntervalSeconds };
    }

    // Get update interval in milliseconds and seconds
    getUpdateInterval() {
        // Debug
        this.node.log(`getting update interval`);

        // Send message to output 2
        const outMsg = {
            payload: {
                message: 'update interval retrieved',
                updateInterval: this.updateInterval,
                updateIntervalSeconds: this.updateIntervalSeconds,
            },
        };
        this.node.send([null, outMsg]);

        return { updateInterval: this.updateInterval, updateIntervalSeconds: this.updateIntervalSeconds };
    }

    // Update the state of each reload in the state machine
    // Check if the reload has finished and if so, delete it from the state machine
    // Check via the get /reloads endpoint if
    //   a) there are any new reloads that are not in the state machine and add them
    //   b) there are any reloads in the state machine that are not in the response and delete them
    async updateReloadStates(node) {
        // Debug
        this.node.log('updating reload states');

        // Get reloads from Qlik Sense Cloud
        const auth = await authenticate(node);
        if (!auth) {
            // Error when authenticating
            node.status({ fill: 'red', shape: 'ring', text: 'error authenticating' });
            return false;
        }

        const allItemsInCloud = [];
        try {
            // Get reload information from Qlik Sense Cloud
            const reloads = await getAllReloads(auth);

            // Concatenate all reloads into one array
            allItemsInCloud.push(...reloads);
        } catch (err) {
            this.node.error(err);
        }

        // Variables to keep track of the number of changes made to the state machine
        let numReloadsAdded = 0;
        let numReloadsDeleted = 0;
        let numReloadsUpdated = 0;

        // Add new reloads to the state machine
        allItemsInCloud.forEach((reload) => {
            if (!this.reloads.has(reload.id)) {
                // Reload is not in the state machine
                // Add it to the state machine
                this.addReload(reload.id, reload);
                numReloadsAdded += 1;
            }
        });

        // Delete reloads from the state machine that are not in the response
        const reloadIds = Array.from(this.reloads.keys());
        reloadIds.forEach((reloadId) => {
            if (!allItemsInCloud.find((item) => item.id === reloadId)) {
                // Reload is not in the response
                // Delete it from the state machine
                this.deleteReload(reloadId);
                numReloadsDeleted += 1;
            }
        });

        // Update the state of each reload in the state machine
        allItemsInCloud.forEach((reload) => {
            const reloadId = reload.id;
            this.updateReload(reloadId, reload.status, reload);
            numReloadsUpdated += 1;
        });

        // Reset number of remaining seconds
        this.remainingSeconds = this.updateIntervalSeconds;

        // Send message to output 2
        const outMsg = {
            payload: {
                message: 'reload states updated',
                numReloadsAdded,
                numReloadsDeleted,
                numReloadsUpdated,
            },
        };
        this.node.send([null, outMsg]);

        return true;
    }
}

// Make  the class available to other files
module.exports = { ReloadStateMachine };
