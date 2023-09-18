/* eslint-disable no-await-in-loop */
const { authenticate } = require('../lib/cloud/auth');
const { getUsers } = require('../lib/cloud/user');

// eslint-disable-next-line func-names
module.exports = function (RED) {
    function QlikSenseCloudUser(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        // Get data from node configuration
        node.tenant = RED.nodes.getNode(config.tenant);
        node.op = config.op || 'r';

        node.on('input', async (msg, send, done) => {
            try {
                const outMsg1 = {
                    payload: {},
                };

                // Get auth object
                const { auth, qlik } = await authenticate(node, done);

                if (!auth) {
                    // Error when authenticating
                    node.status({ fill: 'red', shape: 'ring', text: 'error authenticating' });
                    done('Error authenticating');
                    return false;
                }

                // Which operation to perform?
                if (node.op === 'c') {
                    // Create users
                } else if (node.op === 'r') {
                    // Read users
                    node.log('Getting users from Qlik Sense Cloud...');
                    node.status({ fill: 'yellow', shape: 'dot', text: 'getting users' });

                    // Add app arrays to out message
                    outMsg1.payload.user = [];

                    // Get user information from Qlik Sense Cloud
                    const users = await getUsers(node, qlik);

                    // Add users to out message
                    users.forEach((user) => {
                        outMsg1.payload.user.push(user);
                    });

                    // Log success
                    node.log(`Found ${outMsg1.payload.user.length} matching users on Qlik Sense Cloud.`);
                    node.status({ fill: 'green', shape: 'dot', text: 'users retrieved' });
                } else if (node.op === 'u') {
                    // Update users
                } else if (node.op === 'd') {
                    // Delete users
                } else {
                    // Invalid operation. Log error and return
                    node.status({ fill: 'red', shape: 'ring', text: 'invalid operation' });
                    node.log(`Invalid operation: ${node.op}`);
                    done(`Invalid operation: ${node.op}`);
                    return false;
                }

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

                // Send message to output 1
                send(outMsg1);

                done();
            } catch (err) {
                node.error(err);
                done(err);
            }

            return true;
        });
    }

    RED.nodes.registerType('qscloud-user', QlikSenseCloudUser, {
        defaults: {
            tenant: { value: '', type: 'qscloud-tenant', required: true },
        },
    });
};
