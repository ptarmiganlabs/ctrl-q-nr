/* eslint-disable no-await-in-loop */
const { authenticate } = require('../lib/cloud/auth');
const { getAllReloads } = require('../lib/cloud/reload');

// eslint-disable-next-line func-names
module.exports = function (RED) {
    function QlikSenseCloudReload(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        // Get data from node configuration
        node.tenant = RED.nodes.getNode(config.tenant);
        node.op = config.op || 'g';

        node.on('input', async (msg, send, done) => {
            try {
                const outMsg = {
                    payload: {},
                };

                // Get auth object
                const { auth } = await authenticate(node, done);
                if (!auth) {
                    // Error when authenticating
                    node.status({ fill: 'red', shape: 'ring', text: 'error authenticating' });
                    done('Error authenticating');
                    return false;
                }

                // Which operation to perform?
                if (node.op === 'c') {
                    // Create apps
                } else if (node.op === 'r') {
                    // Read apps
                    node.log('Getting app reloads from Qlik Sense Cloud...');
                    node.status({ fill: 'yellow', shape: 'dot', text: 'getting app reloads' });

                    // Add app arrays to out message
                    outMsg.payload.appReload = [];

                    const allItems = [];
                    try {
                        // Get reload information from Qlik Sense Cloud
                        const reloads = await getAllReloads(auth);

                        // Concatenate all reloads into one array
                        allItems.push(...reloads);
                    } catch (err) {
                        node.error(err);
                        done(err);
                    }

                    outMsg.payload.appReload = allItems;

                    // Log success
                    node.log(`Retrieved ${outMsg.payload.appReload.length} app reloads from Qlik Sense Cloud.`);
                    node.status({ fill: 'green', shape: 'dot', text: 'app reloads retrieved' });
                } else if (node.op === 'u') {
                    // Update apps
                } else if (node.op === 'd') {
                    // Delete apps
                } else {
                    // Invalid operation. Log error and return
                    node.status({ fill: 'red', shape: 'ring', text: 'invalid operation' });
                    node.log(`Invalid operation: ${node.op}`);
                    done(`Invalid operation: ${node.op}`);
                    return false;
                }

                // Send message to output 1
                send(outMsg);

                done();
            } catch (err) {
                node.error(err);
                done(err);
            }

            return true;
        });
    }

    RED.nodes.registerType('qscloud-reload', QlikSenseCloudReload, {
        defaults: {
            tenant: { value: '', type: 'qscloud-tenant', required: true },
        },
    });
};
