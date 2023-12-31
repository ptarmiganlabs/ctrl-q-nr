/* eslint-disable no-await-in-loop */
const { authenticate } = require('../lib/cloud/auth');
const { getCandidateApps } = require('../lib/cloud/appconfig');
const { lookupAppId } = require('../lib/cloud/app');

// eslint-disable-next-line func-names
module.exports = function (RED) {
    function QlikSenseCloudApp(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        // Get data from node configuration
        node.tenant = RED.nodes.getNode(config.tenant);
        node.op = config.op || 'g';
        node.appId = config.appId || '';
        node.appSource1 = config.appSource1 || '';
        node.appSource2 = config.appSource2 || '';

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
                    // Create apps
                } else if (node.op === 'r') {
                    // Read apps
                    node.log('Getting apps from Qlik Sense Cloud...');
                    node.status({ fill: 'yellow', shape: 'dot', text: 'getting apps' });

                    // Add app arrays to out message
                    outMsg1.payload.app = [];
                    outMsg1.payload.appIdNoExist = [];

                    const { appIdCandidates } = getCandidateApps(node, msg, done);

                    // Get app information from Qlik Sense Cloud
                    let response;
                    let responseStatus;
                    let allApps;
                    if (appIdCandidates.length === 0) {
                        // Get all apps
                        // Endpoint is /apps
                        response = await auth.rest('/apps');
                        allApps = await response.json();

                        // Push all app objects to the outMsg1.payload.app array
                        allApps.data.forEach((app) => {
                            outMsg1.payload.app.push(app);
                        });
                    } else if (appIdCandidates.length > 0) {
                        // Loop through the app IDs
                        for (let i = 0; i < appIdCandidates.length; i += 1) {
                            const appId = appIdCandidates[i];

                            // Get app information from Qlik Sense Cloud
                            // Endpoint is /apps/{appId}
                            response = await auth.rest(`/apps/${appId}`);
                            responseStatus = response.status;

                            if (responseStatus === 200) {
                                const app = await response.json();
                                outMsg1.payload.app.push(app);
                            } else {
                                // App does not exist
                                outMsg1.payload.appIdNoExist.push(appId);
                            }
                        }
                    }

                    // Log success
                    node.log(`Found ${outMsg1.payload.app.length} matching apps on Qlik Sense server.`);
                    node.log(`${outMsg1.payload.appIdNoExist.length} of the provided app IDs don't exist on Qlik Sense server.`);
                    node.status({ fill: 'green', shape: 'dot', text: 'apps retrieved' });
                } else if (node.op === 'u') {
                    // Update apps
                } else if (node.op === 'd') {
                    // Delete apps
                } else if (node.op === 'reload') {
                    // Reload apps
                    node.log('Reloading apps on Qlik Sense Cloud...');
                    node.status({ fill: 'yellow', shape: 'dot', text: 'reloading apps' });

                    // Add app arrays to out message
                    outMsg1.payload.app = [];
                    outMsg1.payload.appIdNoExist = [];
                    outMsg1.payload.appError = [];

                    const { appIdCandidates } = getCandidateApps(node, msg, done);

                    let response;
                    let responseStatus;

                    // Log number of entries in appIdCandidates
                    node.log(`appIdCandidates.length: ${appIdCandidates.length}`);

                    // Start reloads
                    // Loop through the app IDs
                    for (let i = 0; i < appIdCandidates.length; i += 1) {
                        const appId = appIdCandidates[i];

                        try {
                            const data = {
                                appId,
                                partial: false,
                            };

                            response = await auth.rest(`/reloads`, {
                                method: 'POST',
                                body: JSON.stringify(data),
                            });

                            responseStatus = response.status;
                            const reloadInfo = await response.json();

                            // Debug log
                            // node.log(`Reload response: ${JSON.stringify(response, null, 2)}`);
                            // node.log(`Reload result: ${JSON.stringify(reloadInfo, null, 2)}`);

                            if (responseStatus === 201) {
                                // Reload queued successfully
                                outMsg1.payload.app.push(reloadInfo);
                            } else {
                                // Error when queuing reload
                                outMsg1.payload.appError.push(reloadInfo);
                            }
                        } catch (err) {
                            // Error when queuing reload
                            // Err has format
                            // {
                            //     "error": "Not Found",
                            //     "statusText": "Not Found",
                            //     "status": 404,
                            //     "response": {},
                            //     "traceId": "0000000000000000d888eb58add4f0e0",
                            //     "errors": [
                            //         {
                            //             "code": "RELOADS-004",
                            //     "title": "Resource not found.",
                            //     "detail": "The resource either never existed, or may have been deleted."
                            //         }
                            //     ],
                            //     "name": "NotFoundError"
                            // }

                            if (err.status === 404) {
                                // App does not exist
                                outMsg1.payload.appIdNoExist.push(appId);
                            } else {
                                // Other error
                                outMsg1.payload.appError.push({ appId, err });
                            }
                            // node.error(err);
                            // node.status({ fill: 'red', shape: 'ring', text: err });
                            // done(err);
                            // return;
                        }
                    }

                    // Log success
                    node.log(`Queued ${outMsg1.payload.app.length} app reloads on Qlik Sense Cloud.`);
                    node.log(`${outMsg1.payload.appIdNoExist.length} of the provided app IDs could not be reloaded on Qlik Sense Cloud.`);

                    // Set node status. If there were any missing apps or errors, set status to red
                    if (outMsg1.payload.appIdNoExist.length > 0 || outMsg1.payload.appError.length > 0) {
                        node.status({ fill: 'red', shape: 'ring', text: 'errors/warnings, check output' });
                    } else {
                        node.status({ fill: 'green', shape: 'dot', text: 'app reloads queued' });
                    }
                } else if (node.op === 'dupl') {
                    // Duplicate apps
                } else if (node.op === 'app-id-lookup') {
                    // Lookup app IDs
                    node.log('Looking up app IDs on Qlik Sense Cloud...');
                    node.status({ fill: 'yellow', shape: 'dot', text: 'looking up app IDs' });

                    // Make sure there is a msg.payload object
                    if (!msg.payload) {
                        node.status({ fill: 'red', shape: 'ring', text: 'msg.payload is missing' });
                        done('msg.payload is missing');
                        return false;
                    }

                    // If msg.payload.appName exists it should be an array
                    if (msg.payload.appName && !Array.isArray(msg.payload.appName)) {
                        node.status({ fill: 'red', shape: 'ring', text: 'msg.payload.appName is not an array' });
                        done('msg.payload.appName is not an array');
                        return false;
                    }

                    // If msg.payload.spaceName exists it should be an array
                    if (msg.payload.spaceName && !Array.isArray(msg.payload.spaceName)) {
                        node.status({ fill: 'red', shape: 'ring', text: 'msg.payload.spaceName is not an array' });
                        done('msg.payload.spaceName is not an array');
                        return false;
                    }

                    // Add app object, which in turn has an id array, to out message
                    outMsg1.payload = { appId: [], appObj: [] };

                    try {
                        // Get app information from Qlik Sense Cloud
                        // Return from lookupAppId is an array of app IDs
                        const { uniqueAppIds, uniqueAppObjects } = await lookupAppId(node, qlik, msg.payload);

                        // Did we get any results in uniqueAppIds?
                        if (!uniqueAppIds || !Array.isArray(uniqueAppIds)) {
                            node.log('Error getting app IDs in lookupAppId');
                            node.status({ fill: 'red', shape: 'ring', text: 'error getting app IDs' });
                            return false;
                        }

                        // Did we get any results in uniqueAppObjects?
                        if (!uniqueAppObjects || !Array.isArray(uniqueAppObjects)) {
                            node.log('Error getting app objects in lookupAppId');
                            node.status({ fill: 'red', shape: 'ring', text: 'error getting app objects' });
                            return false;
                        }

                        // Concatenate all app IDs and objects into output message
                        outMsg1.payload.appId.push(...uniqueAppIds);
                        outMsg1.payload.appObj.push(...uniqueAppObjects);

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

                        send(outMsg1);

                        done();
                    } catch (err) {
                        node.error(err);
                        done(err);
                    }

                    // Log success
                    node.log(`Found ${outMsg1.payload.appId.length} matching apps on Qlik Sense Cloud.`);
                    node.status({ fill: 'green', shape: 'dot', text: 'app IDs retrieved' });

                    return true;
                } else if (node.op === 'get-scripts') {
                    // Get scripts from apps
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

    RED.nodes.registerType('qscloud-app', QlikSenseCloudApp, {
        defaults: {
            tenant: { value: '', type: 'qscloud-tenant', required: true },
        },
    });
};
