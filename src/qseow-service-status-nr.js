const { getServiceStatus } = require('./lib/qseow/servicestatus');

// eslint-disable-next-line func-names
module.exports = function (RED) {
    function QseowServiceStatusGet(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        // Get data from node configuration
        node.senseServer = RED.nodes.getNode(config.server);

        node.on('input', async (msg, send, done) => {
            try {
                node.log('Getting service status from Qlik Sense server...');
                node.status({ fill: 'yellow', shape: 'dot', text: 'getting service status' });

                const outMsg1 = {
                    payload: {},
                };

                // Get service status
                const response = await getServiceStatus(node, done);
                if (response === null) {
                    // Nothing to do
                    return;
                }

                // Build outMsg1
                outMsg1.payload.serviceStatus = response;

                send(outMsg1);

                // Log success
                node.log(`Service status retrieved.`);
                node.status({ fill: 'green', shape: 'dot', text: `service status retrieved` });

                // Wrap up
                done();
            } catch (error) {
                node.status({ fill: 'red', shape: 'ring', text: 'error getting service status' });
                node.log(`Error getting service status: ${error}`);
                done(error);
            }
        });
    }

    RED.nodes.registerType('qseow-service-status', QseowServiceStatusGet, {
        defaults: {
            senseServer: { value: '', type: 'qlik-sense-server', required: true },
        },
    });
};
