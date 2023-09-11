const { getLicense } = require('../lib/qseow/license');

// eslint-disable-next-line func-names
module.exports = function (RED) {
    function QseowLicense(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        // Get data from node configuration
        node.senseServer = RED.nodes.getNode(config.server);
        node.op = config.op || 'r';

        node.on('input', async (msg, send, done) => {
            try {
                const outMsg1 = {
                    payload: {},
                };

                // Which operation to perform?
                if (node.op === 'r') {
                    // Read license
                    node.log('Getting license from Qlik Sense server...');
                    node.status({ fill: 'yellow', shape: 'dot', text: 'getting license' });

                    let result;
                    try {
                        result = await getLicense(node, done);
                    } catch (error) {
                        node.status({ fill: 'red', shape: 'ring', text: 'error getting license' });
                        node.log(`Error getting license from Qlik Sense server: ${error}`);
                        done(error);
                        return;
                    }

                    if (result !== null) {
                        // Build outMsg1
                        outMsg1.payload.license = result.license;

                        // Send outMsg11
                        node.send(outMsg1);
                    } else {
                        // Error getting license
                        node.status({ fill: 'red', shape: 'ring', text: 'error getting license' });
                        node.log('Error getting license.');
                        done('Error getting license.');
                        return;
                    }

                    // Log success
                    node.log(`License retrieved from Qlik Sense server.`);
                    node.status({ fill: 'green', shape: 'dot', text: 'license retrieved' });
                } else {
                    // Invalid operation
                    node.status({ fill: 'red', shape: 'ring', text: 'invalid operation' });
                    node.log(`Invalid operation: ${node.op}`);
                    done(`Invalid operation: ${node.op}`);
                    return;
                }

                // Wrap up
                done();
            } catch (error) {
                node.status({ fill: 'red', shape: 'ring', text: 'error getting license' });
                node.log(`Error getting license from Qlik Sense server: ${error}`);
                done(error);
            }
        });
    }

    RED.nodes.registerType('qseow-license', QseowLicense, {
        defaults: {
            senseServer: { value: '', type: 'qseow-sense-server', required: true },
        },
    });
};
