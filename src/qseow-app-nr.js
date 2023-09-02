const { getApps, deleteApps, duplicateApps, updateApps } = require('./lib/qseow/app');
const { getCandidateAppsPredefAndIncoming } = require('./lib/qseow/appconfig');

// eslint-disable-next-line func-names
module.exports = function (RED) {
    function QseowApp(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        // Get data from node configuration
        node.senseServer = RED.nodes.getNode(config.server);
        node.op = config.op || 'r';
        node.appId = config.appId || '';
        node.appSource1 = config.appSource1 || '';
        node.appSource2 = config.appSource2 || '';

        node.on('input', async (msg, send, done) => {
            try {
                const outMsg1 = {
                    payload: {},
                };

                // // Process incoming apps from the incoming message
                // let appIdsPredefined;
                // let appsIncoming;
                // let appsCreated = [];

                // const appsProcess = [];
                // const appIdsNoExists = [];

                // Which operation to perform?
                if (node.op === 'c') {
                    // Create apps
                } else if (node.op === 'r') {
                    // Read apps
                    node.log('Getting apps from Qlik Sense server...');
                    node.status({ fill: 'yellow', shape: 'dot', text: 'getting apps' });

                    // Get candidate app IDs
                    const res = getCandidateAppsPredefAndIncoming(node, done, msg);
                    if (res === null) {
                        // Nothing to do
                        return;
                    }

                    const { appIdCandidates } = res;

                    // Log the app IDs
                    node.log(`App IDs for operation "${node.op}": ${appIdCandidates}`);

                    let result;
                    try {
                        result = await getApps(node, done, appIdCandidates);
                    } catch (error) {
                        node.status({ fill: 'red', shape: 'ring', text: 'error getting apps' });
                        node.log(`Error getting apps from Qlik Sense server: ${error}`);
                        done(error);
                        return;
                    }

                    if (result !== null) {
                        // Build outMsg1
                        outMsg1.payload.app = result.app;
                        outMsg1.payload.appIdNoExist = result.appIdNoExist;

                        // Send outMsg11
                        node.send(outMsg1);
                    } else {
                        // Error getting apps
                        node.status({ fill: 'red', shape: 'ring', text: 'error getting apps' });
                        node.log('Error getting apps.');
                        done('Error getting apps.');
                        return;
                    }

                    // Log success
                    node.log(`Found ${outMsg1.payload.app.length} matching apps on Qlik Sense server.`);
                    node.log(`${outMsg1.payload.appIdNoExist.length} of the provided app IDs don't exist on Qlik Sense server.`);
                    node.status({ fill: 'green', shape: 'dot', text: 'apps retrieved' });
                } else if (node.op === 'u') {
                    // Update apps
                    node.log('Updating apps on Qlik Sense server...');
                    node.status({ fill: 'yellow', shape: 'dot', text: 'updating apps' });

                    // Only use app IDs from incoming messages, not from predefined list in node configuration

                    // Incoming message is an array of objects with properties
                    // - "app" Array of app identifiers
                    //   - "id" App id to update
                    // - "newData" Data to update with
                    //   - "name" Name of the app
                    //   - "description" Description of the app
                    //   - "tag" Array of tag names to apply to the app(s)

                    // Sanity check structure of incoming message.
                    // Error if something is missing or if app and newData are not arrays
                    if (!msg.payload || !msg.payload.app || !msg.payload.app || !msg.payload.newData || !Array.isArray(msg.payload.app)) {
                        // Log error
                        node.status({ fill: 'red', shape: 'ring', text: 'invalid incoming message' });
                        node.log('Invalid incoming message.');
                        done('Invalid incoming message.');
                        return;
                    }

                    // Ensure newData.name is a string, if it exists
                    if (msg.payload.newData.name && typeof msg.payload.newData.name !== 'string') {
                        // Log error
                        node.status({ fill: 'red', shape: 'ring', text: 'invalid incoming message' });
                        node.log('Invalid incoming message.');
                        done('Invalid incoming message.');
                        return;
                    }

                    // Ensure newData.description is a string, if it exists
                    if (msg.payload.newData.description && typeof msg.payload.newData.description !== 'string') {
                        // Log error
                        node.status({ fill: 'red', shape: 'ring', text: 'invalid incoming message' });
                        node.log('Invalid incoming message.');
                        done('Invalid incoming message.');
                        return;
                    }

                    // Ensure newData.tag is an array, if it exists
                    if (msg.payload.newData.tag && !Array.isArray(msg.payload.newData.tag)) {
                        // Log error
                        node.status({ fill: 'red', shape: 'ring', text: 'invalid incoming message' });
                        node.log('Invalid incoming message.');
                        done('Invalid incoming message.');
                        return;
                    }

                    let appUpdated = [];
                    let appIdNoExist = [];
                    let result;

                    try {
                        result = await updateApps(node, msg.payload);
                        appUpdated = result.appUpdated;
                        appIdNoExist = result.appIdNoExist;
                    } catch (error) {
                        node.status({ fill: 'red', shape: 'ring', text: 'error updating apps' });
                        node.log(`Error updating apps on Qlik Sense server: ${error}`);
                        done(error);
                        return;
                    }

                    // Build outMsg1
                    outMsg1.payload.appUpdated = appUpdated;
                    outMsg1.payload.appIdNoExist = appIdNoExist;

                    // Log success
                    node.log(`Updated ${appUpdated.length} apps on Qlik Sense server.`);
                    node.log(`App IDs that did not exist on server: ${appIdNoExist}`);
                    node.status({ fill: 'green', shape: 'dot', text: 'apps updated' });

                    // Send message to output 1
                    send(outMsg1);
                } else if (node.op === 'd') {
                    // Delete apps
                    node.log('Deleting apps from Qlik Sense server...');
                    node.status({ fill: 'yellow', shape: 'dot', text: 'deleting apps' });

                    // Only use app IDs from incoming messages, not from predefined list in node configuration

                    // Incoming message is an object with following properties
                    // - "appId" Array of app ids to delete

                    // Sanity check structure of incoming message.
                    // Error and return if a mandatory property is missing or if payload.appId is not an array
                    if (!msg.payload || !msg.payload.appId || !Array.isArray(msg.payload.appId)) {
                        // Log error
                        node.status({ fill: 'red', shape: 'ring', text: 'invalid incoming message' });
                        node.log('Invalid incoming message.');
                        done('Invalid incoming message.');
                        return;
                    }

                    // Ensure all items in payload.appId are valid UUIDs
                    // If not, log error and return
                    for (let i = 0; i < msg.payload.appId.length; i += 1) {
                        if (!msg.payload.appId[i].match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)) {
                            // Log error
                            node.status({ fill: 'red', shape: 'ring', text: 'invalid incoming message' });
                            node.log('Invalid incoming message. One or more app IDs are not valid UUIDs.');
                            done('Invalid incoming message. One or more app IDs are not valid UUIDs.');
                            return;
                        }
                    }

                    let appDeleted = [];
                    let appIdNoExist = [];
                    let result;

                    try {
                        result = await deleteApps(node, msg.payload.appId);
                        appDeleted = result.appDeleted;
                        appIdNoExist = result.appIdNoExist;
                    } catch (error) {
                        node.status({ fill: 'red', shape: 'ring', text: 'error deleting apps' });
                        node.log(`Error deleting apps on Qlik Sense server: ${error}`);
                        done(error);
                        return;
                    }

                    // Build outMsg1
                    outMsg1.payload.appDeleted = appDeleted;
                    outMsg1.payload.appIdNoExist = appIdNoExist;

                    // Log success
                    node.log(`Deleted ${appDeleted.length} apps on Qlik Sense server.`);
                    node.log(`App IDs that did not exist on server: ${appIdNoExist}`);
                    node.status({ fill: 'green', shape: 'dot', text: 'apps deleted' });

                    // Send message to output 1
                    send(outMsg1);
                } else if (node.op === 'dupl') {
                    // Duplicate apps
                    node.log('Duplicating apps on Qlik Sense server...');
                    node.status({ fill: 'yellow', shape: 'dot', text: 'duplicating apps' });

                    // Only use app IDs from incoming messages, not from predefined list in node configuration

                    // Incoming message is an array of objects with properties
                    // - "sourceAppId" Id of source app. Mandatory
                    // - "newAppName" Name of new app. If empty, use name of source app + "copy" + timestamp
                    // - "includeCustomProperties" Flag to indicate if source app's custom properties should be copied. true/false  (default: false)

                    // Sanity check structure of incoming message.
                    // Error and return if a mandatory property is missing or if payload is not an array
                    if (!msg.payload || !Array.isArray(msg.payload)) {
                        // Log error
                        node.status({ fill: 'red', shape: 'ring', text: 'invalid incoming message' });
                        node.log('Invalid incoming message.');
                        done('Invalid incoming message.');
                        return;
                    }

                    // Ensure that every element in the array has a sourceAppId property
                    // If not, log error and return
                    for (let i = 0; i < msg.payload.length; i += 1) {
                        if (!msg.payload[i].sourceAppId) {
                            // Log error
                            node.status({ fill: 'red', shape: 'ring', text: 'invalid incoming message' });
                            node.log('Invalid incoming message.');
                            done('Invalid incoming message.');
                            return;
                        }
                    }

                    // Add app arrays to out message
                    let appCreated = [];
                    let appIdNoExist = [];

                    // Duplicate apps
                    node.log('Duplicating apps on Qlik Sense server...');
                    node.status({ fill: 'yellow', shape: 'dot', text: 'duplicating apps' });

                    let result;
                    try {
                        result = await duplicateApps(node, msg.payload);
                        appCreated = result.appCreated;
                        appIdNoExist = result.appIdNoExist;
                    } catch (error) {
                        node.status({ fill: 'red', shape: 'ring', text: 'error duplicating apps' });
                        node.log(`Error duplicating apps on Qlik Sense server: ${error}`);
                        done(error);
                        return;
                    }

                    // Build outMsg1
                    outMsg1.payload.appCreated = appCreated;
                    outMsg1.payload.appIdNoExist = appIdNoExist;

                    // Log success
                    node.log(`Duplicated ${appCreated.length} apps on Qlik Sense server.`);
                    node.log(`App IDs that did not exist on server: ${appIdNoExist}`);
                    node.status({ fill: 'green', shape: 'dot', text: 'apps duplicated' });

                    // Send message to output 1
                    send(outMsg1);
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
                node.status({ fill: 'red', shape: 'ring', text: 'error getting app metadata' });
                node.log(`Error getting app metadata: ${error}`);
                done(error);
            }
        });
    }

    RED.nodes.registerType('qseow-app', QseowApp, {
        defaults: {
            senseServer: { value: '', type: 'qseow-sense-server', required: true },
        },
    });
};
