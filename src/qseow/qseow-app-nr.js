/* eslint-disable no-underscore-dangle */
const { getApps, deleteApps, duplicateApps, updateApps, getAppLoadScript, setAppLoadScript, lookupAppId } = require('../lib/qseow/app');
const { getCandidateAppsPredefAndIncoming } = require('../lib/qseow/appconfig');

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

                // Which operation to perform?
                if (node.op === 'c') {
                    // Create apps
                } else if (node.op === 'r') {
                    // Read apps
                    node.log('Getting apps from Qlik Sense server...');
                    node.status({ fill: 'yellow', shape: 'dot', text: 'getting apps' });

                    // Get source of app IDs, then set save it in the node object
                    if (node.appSource1 === 'msg-in') {
                        node.appSource = 'msg-in';
                    } else if (node.appSource1 === 'predefined') {
                        node.appSource = 'predefined';
                    } else {
                        // Log error
                        node.log(`Invalid app source: "${node.appSource1}"`);

                        node.appSource = 'invalid';
                    }

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

                        // Send outMsg11
                        send(outMsg1);
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

                    // Source of app IDs is always incoming message for this operation
                    node.appSource = 'msg-in';

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

                    // Source of app IDs is always incoming message for this operation
                    node.appSource = 'msg-in';

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

                    // Log success
                    node.log(`Deleted ${appDeleted.length} apps on Qlik Sense server.`);
                    node.log(`App IDs that did not exist on server: ${appIdNoExist}`);
                    node.status({ fill: 'green', shape: 'dot', text: 'apps deleted' });

                    // Send message to output 1
                    send(outMsg1);
                } else if (node.op === 'app-id-lookup') {
                    // Lookup app IDs
                    node.log('Looking up app IDs on Qlik Sense server...');
                    node.status({ fill: 'yellow', shape: 'dot', text: 'looking up app IDs' });

                    // Source of app IDs is always incoming message for this operation
                    node.appSource = 'msg-in';

                    // Make sure there is a msg.payload object
                    if (!msg.payload) {
                        node.status({ fill: 'red', shape: 'ring', text: 'msg.payload is missing' });
                        done('msg.payload is missing');
                        return;
                    }

                    // If msg.payload.appName exists it should be an array
                    if (msg.payload.appName && !Array.isArray(msg.payload.appName)) {
                        node.status({ fill: 'red', shape: 'ring', text: 'msg.payload.appName is not an array' });
                        done('msg.payload.appName is not an array');
                        return;
                    }

                    // If msg.payload.streamName exists it should be an array
                    if (msg.payload.streamName && !Array.isArray(msg.payload.streamName)) {
                        node.status({ fill: 'red', shape: 'ring', text: 'msg.payload.streamName is not an array' });
                        done('msg.payload.streamName is not an array');
                        return;
                    }

                    // Add app arrays to out message
                    outMsg1.payload = { appId: [], appObj: [] };

                    try {
                        // Get app info from Qlik Sense server
                        const { uniqueAppIds, uniqueAppObjects } = await lookupAppId(node, msg.payload);

                        // Did we get any result in uniqueAppIds?
                        if (!uniqueAppIds || !Array.isArray(uniqueAppIds)) {
                            node.log('Error getting app IDs in lookupAppId');
                            node.status({ fill: 'red', shape: 'ring', text: 'error getting app IDs' });
                            return;
                        }

                        // Did we get any results in uniqueAppObjects?
                        if (!uniqueAppObjects || !Array.isArray(uniqueAppObjects)) {
                            node.log('Error getting app objects in lookupAppId');
                            node.status({ fill: 'red', shape: 'ring', text: 'error getting app objects' });
                            return;
                        }

                        // Concatenate all app IDs and objects into output message
                        outMsg1.payload.appId.push(...uniqueAppIds);
                        outMsg1.payload.appObj.push(...uniqueAppObjects);

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

                        // Send message to output 1
                        send(outMsg1);
                    } catch (err) {
                        node.error(err);
                        done(err);
                    }

                    // Log success
                    node.log(`Found ${outMsg1.payload.appId.length} matching apps on Qlik Sense server.`);
                    node.status({ fill: 'green', shape: 'dot', text: 'apps IDs retrieved' });
                } else if (node.op === 'dupl') {
                    // Duplicate apps
                    node.log('Duplicating apps on Qlik Sense server...');
                    node.status({ fill: 'yellow', shape: 'dot', text: 'duplicating apps' });

                    // Source of app IDs is always incoming message for this operation
                    node.appSource = 'msg-in';

                    // Only use app IDs from incoming messages, not from predefined list in node configuration

                    // Incoming message is an array of objects with properties
                    // - "sourceAppId" Id of source app. Mandatory
                    // - "newAppName" Name of new app. If empty, use name of source app + "copy" + timestamp
                    // - "includeCustomProperties" Flag to indicate if source app's custom properties should be copied.
                    //   true/false  (default: false)

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
                } else if (node.op === 'get-script') {
                    // Get script from apps
                    node.log('Getting app load scripts from Qlik Sense server...');
                    node.status({ fill: 'yellow', shape: 'dot', text: 'getting app load scripts' });

                    // Get source of app IDs, then set save it in the node object
                    if (node.appSource1 === 'msg-in') {
                        node.appSource = 'msg-in';
                    } else if (node.appSource1 === 'predefined') {
                        node.appSource = 'predefined';
                    } else {
                        // Log error
                        node.log(`Invalid app source: "${node.appSource1}"`);

                        node.appSource = 'invalid';
                    }

                    // Get candidate app IDs
                    const res = getCandidateAppsPredefAndIncoming(node, done, msg);
                    if (res === null) {
                        // Nothing to do
                        return;
                    }

                    const { appIdCandidates } = res;

                    // Make sure we have at least one app ID
                    // if (appIdCandidates.length === 0) {
                    //     node.status({ fill: 'red', shape: 'ring', text: 'no app IDs provided' });
                    //     done('No app IDs provided.');
                    //     return;
                    // }

                    // Log the app IDs
                    node.log(`App IDs for operation "${node.op}": ${appIdCandidates}`);

                    let result;
                    try {
                        result = await getAppLoadScript(node, appIdCandidates);
                    } catch (error) {
                        node.status({ fill: 'red', shape: 'ring', text: 'error getting app load scripts' });
                        done(error);
                        return;
                    }

                    if (result !== null) {
                        // Build outMsg1
                        outMsg1.payload.app = result.app;
                        outMsg1.payload.appIdNoExist = result.appIdNoExist;

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

                        // Send outMsg11
                        send(outMsg1);
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
                    node.status({ fill: 'green', shape: 'dot', text: 'app load scripts retrieved' });
                } else if (node.op === 'set-script') {
                    // Set script in app
                    node.log('Setting app load script on Qlik Sense server...');
                    node.status({ fill: 'yellow', shape: 'dot', text: 'setting app load script' });

                    // Source of app IDs is always incoming message for this operation
                    node.appSource = 'msg-in';

                    // Incoming message is an object with following properties
                    // - "app": Array of app objects
                    //   - "id": App id to update
                    //   - "script": App load script

                    let result;
                    try {
                        result = await setAppLoadScript(node, msg.payload.app);
                    } catch (error) {
                        node.status({ fill: 'red', shape: 'ring', text: 'error setting app load script' });
                        done(error);
                        return;
                    }

                    if (result !== null) {
                        // Build outMsg1
                        outMsg1.payload.app = result.app;
                        outMsg1.payload.appIdNoExist = result.appIdNoExist;

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

                        // Send outMsg11
                        send(outMsg1);
                    } else {
                        // Error setting app load script
                        node.status({ fill: 'red', shape: 'ring', text: 'error setting app load script' });
                        node.log('Error setting app load script.');
                        done('Error setting app load script.');
                        return;
                    }

                    // Log success
                    node.log(`Set app load script in ${outMsg1.payload.app.length} apps on Qlik Sense server.`);
                    node.log(`${outMsg1.payload.appIdNoExist.length} of the provided app IDs don't exist on Qlik Sense server.`);
                    node.status({ fill: 'green', shape: 'dot', text: 'app load script set' });
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
