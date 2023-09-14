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
                const outMsg = {
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
                    outMsg.payload.user = [];

                    // Get user information from Qlik Sense Cloud
                    const users = await getUsers(node, qlik);

                    // Add users to out message
                    users.forEach((user) => {
                        outMsg.payload.user.push(user);
                    });

                    // Log success
                    node.log(`Found ${outMsg.payload.user.length} matching users on Qlik Sense Cloud.`);
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

    RED.nodes.registerType('qscloud-user', QlikSenseCloudUser, {
        defaults: {
            tenant: { value: '', type: 'qscloud-tenant', required: true },
        },
    });
};
