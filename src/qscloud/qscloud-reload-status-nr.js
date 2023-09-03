const { ReloadStateMachine } = require('../lib/cloud/reloadstatus');

// eslint-disable-next-line func-names
module.exports = function (RED) {
    function QlikSenseCloudReloadStatus(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        // Get data from node configuration
        node.tenant = RED.nodes.getNode(config.tenant);
        node.op = config.op || '';

        // Create a reload state object
        const reloadState = new ReloadStateMachine(node, 15000);

        // Do initial update of reload states
        // const res = await reloadState.updateReloadStates(node);
        // if (!res) {
        //     node.error('Error updating reload states');
        //     return false;
        // }

        node.on('input', async (msg, send, done) => {
            try {
                const outMsg = {
                    payload: {},
                };

                if (msg.payload.operation === 'getFullState') {
                    // If msg.payload.operation = getFullState, send the entire state machine to output 2
                    outMsg.payload = reloadState.getFullState();
                    node.send([null, outMsg]);
                } else if (msg.payload.operation === 'stopTimer') {
                    // Stop the timer
                    reloadState.stopTimer();
                    node.status({ fill: 'green', shape: 'dot', text: 'timer stopped' });
                } else if (msg.payload.operation === 'startTimer') {
                    // Start the timer
                    reloadState.startTimer();
                    node.status({ fill: 'green', shape: 'dot', text: 'timer started' });
                } else if (msg.payload.operation === 'updateReloadStates') {
                    // Update the reload states
                    const res2 = await reloadState.updateReloadStates(node);
                    if (!res2) {
                        node.error('Error updating reload states');
                        node.status({ fill: 'red', shape: 'ring', text: 'error updating reload states' });
                        return false;
                    }
                } else if (msg.payload.operation === 'setUpdateInterval') {
                    // Set the update interval in milliseconds
                    reloadState.setUpdateInterval(msg.payload.updateInterval);
                } else if (msg.payload.operation === 'getUpdateInterval') {
                    // Get the update interval in milliseconds and seconds
                    // Sends the update interval to output 2
                    reloadState.getUpdateInterval();
                } else {
                    // Invalid operation
                    node.error(`Invalid operation: ${msg.payload.operation}`);
                    node.status({ fill: 'red', shape: 'ring', text: 'invalid operation' });
                    done(`Invalid operation: ${msg.payload.operation}`);
                    return false;
                }

                done();
            } catch (err) {
                node.error(err);
                done(err);
            }

            return true;
        });
    }

    RED.nodes.registerType('qscloud-reload-status', QlikSenseCloudReloadStatus, {
        defaults: {
            tenant: { value: '', type: 'qscloud-tenant', required: true },
        },
    });
};
