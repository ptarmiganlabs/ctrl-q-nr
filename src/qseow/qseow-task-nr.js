/* eslint-disable no-underscore-dangle */
const { getCandidateTasks } = require('../lib/qseow/taskconfig');
const { startTasks, lookupTaskId } = require('../lib/qseow/task');

// eslint-disable-next-line func-names
module.exports = function (RED) {
    function QseowTask(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        //
        // Get data from node configuration
        node.senseServer = RED.nodes.getNode(config.server);
        node.op = config.op;
        node.taskId = config.taskId || '';
        node.taskSource1 = config.taskSource1 || '';
        node.taskSource2 = config.taskSource2 || '';

        node.on('input', async (msg, send, done) => {
            try {
                const outMsg1 = {
                    payload: {},
                };

                // Which operation to perform?
                if (node.op === 'c') {
                    // Create tasks
                } else if (node.op === 'r') {
                    // Read tasks
                } else if (node.op === 'u') {
                    // Update tasks
                } else if (node.op === 'd') {
                    // Delete tasks
                } else if (node.op === 'start') {
                    // Start tasks

                    // Get candidate task IDs
                    const { taskIdCandidates } = getCandidateTasks(node, done, msg);

                    // Log the task IDs to be started
                    node.log(`Task IDs to be started: ${taskIdCandidates}`);

                    // Start tasks based on task IDs
                    const result = await startTasks(node, done, taskIdCandidates);

                    if (result !== null) {
                        // Build outMsg1
                        outMsg1.payload.started = {};
                        outMsg1.payload.started.reloadTask = result.reloadTaskToStart;
                        outMsg1.payload.started.externalProgramTask = result.externalProgramTaskToStart;
                        outMsg1.payload.started.distributionTask = result.distributionTaskToStart;
                        outMsg1.payload.started.userSyncTask = result.userSyncTaskToStart;
                        outMsg1.payload.taskIdNoExist = result.taskIdNoExist;

                        // Add parts and reset properties if they are present
                        if (msg.parts) {
                            outMsg1.parts = msg.parts;
                        }
                        // eslint-disable-next-line no-underscore-dangle
                        if (msg._msgid) {
                            // eslint-disable-next-line no-underscore-dangle
                            outMsg1._msgid = msg._msgid;
                        }
                        if (msg.reset) {
                            outMsg1.reset = msg.reset;
                        }

                        // Send outMsg1
                        send(outMsg1);
                    }
                } else if (node.op === 'task-id-lookup') {
                    // Look up task IDs
                    node.log(`Looking up task IDs on Qlik Sense server...`);
                    node.status({ fill: 'yellow', shape: 'dot', text: 'looking up task IDs' });

                    // Make sure there is a msg.payload object
                    if (!msg.payload) {
                        node.status({ fill: 'red', shape: 'ring', text: 'msg.payload is missing' });
                        done('msg.payload is missing');
                        return;
                    }

                    // If msg.payload.taskName exists it should be an array
                    if (msg.payload.taskName && !Array.isArray(msg.payload.taskName)) {
                        node.status({ fill: 'red', shape: 'ring', text: 'msg.payload.taskName is not an array' });
                        done('msg.payload.taskName is not an array');
                        return;
                    }

                    // If msg.payload.tagName exists it should be an array
                    if (msg.payload.tagName && !Array.isArray(msg.payload.tagName)) {
                        node.status({ fill: 'red', shape: 'ring', text: 'msg.payload.tagName is not an array' });
                        done('msg.payload.tagName is not an array');
                        return;
                    }
                    // Add task arrays to out message
                    outMsg1.payload = { taskId: [], taskObj: [] };

                    try {
                        // Get task info from Qlik Sense server
                        const { uniqueTaskIds, uniqueTaskObjects } = await lookupTaskId(node, msg.payload);

                        // Did we get any results in uniqueTaskIds?
                        if (!uniqueTaskIds || !Array.isArray(uniqueTaskIds)) {
                            node.log('Error getting task IDs in lookupTaskId');
                            node.status({ fill: 'red', shape: 'ring', text: 'error getting task IDs' });
                            return;
                        }

                        // Did we get any results in uniqueTaskObjects?
                        if (!uniqueTaskObjects || !Array.isArray(uniqueTaskObjects)) {
                            node.log('Error getting task objects in lookupTaskId');
                            node.status({ fill: 'red', shape: 'ring', text: 'error getting task objects' });
                            return;
                        }

                        // Concatenate all task IDs and objects into output message
                        outMsg1.payload.taskId.push(...uniqueTaskIds);
                        outMsg1.payload.taskObj.push(...uniqueTaskObjects);

                        // Add parts and reset properties if they are present
                        if (msg.parts) {
                            outMsg1.parts = msg.parts;
                        }
                        if (msg._msgid) {
                            outMsg1._msgid = msg._msgid;
                        }
                        if (msg.reset) {
                            outMsg1.reset = msg.reset;
                        }

                        // Send outMsg1
                        send(outMsg1);
                    } catch (err) {
                        // Log error
                        node.error(`Error looking up task IDs on Qlik Sense server: ${err}`);
                        node.status({ fill: 'red', shape: 'ring', text: 'error looking up task IDs' });
                        done(err);
                    }

                    // Log success
                    node.log(`Found ${outMsg1.payload.taskId.length} matching task IDs on Qlik Sense server`);
                    node.status({ fill: 'green', shape: 'dot', text: 'task IDs retrieved' });
                } else {
                    // Log error
                    node.status({ fill: 'red', shape: 'ring', text: 'invalid operation' });
                    node.log(`Invalid operation: ${node.op}`);
                    done(`Invalid operation: ${node.op}`);
                    return;
                }

                // Wrap up
                done();
            } catch (error) {
                node.status({ fill: 'red', shape: 'ring', text: 'error getting tasks' });
                node.log(`Error getting reload task from Qlik Sense server: ${error}`);
                done(error);
            }
        });
    }

    RED.nodes.registerType('qseow-task', QseowTask, {
        defaults: {
            senseServer: { value: '', type: 'qseow-sense-server', required: true },
            taskId: { value: [], required: false },
        },
    });
};
