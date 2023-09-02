const { getCandidateTasks } = require('./lib/qseow/taskconfig');
const { startTasks } = require('./lib/qseow/task');

// eslint-disable-next-line func-names
module.exports = function (RED) {
    function QseowTask(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        // Get data from node configuration
        node.senseServer = RED.nodes.getNode(config.server);
        node.op = config.op;
        node.taskId = config.taskId || '';
        node.taskSource = config.taskSource1 || '';

        node.on('input', async (msg, send, done) => {
            try {
                const outMsg1 = {
                    payload: {
                        started: {},
                    },
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

                        // Send outMsg1
                        node.send(outMsg1);
                    } else {
                        // Log error
                        node.status({ fill: 'red', shape: 'ring', text: 'error starting tasks' });
                        node.log('Error starting tasks.');
                        done('Error starting tasks.');
                        return;
                    }
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
            senseServer: { value: '', type: 'qlik-sense-server', required: true },
            taskId: { value: [], required: false },
        },
    });
};
