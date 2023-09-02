const axios = require('axios');

const { getTags, getAppTags } = require('./tag');
const { getAuth } = require('./auth');

// Functon to get apps from Qlik Sense server
// Parameters:
// - node: the node object
// - done: the done function
// - appIdsToGet: an array of app IDs to get
async function getApps(node, done, appIdsToGet) {
    const { axiosConfig, xref } = getAuth(node);

    // Should we get all apps or only apps with specific IDs?
    if (appIdsToGet === undefined || appIdsToGet.length === 0) {
        // Get all apps from Qlik Sense server
        axiosConfig.url = `/qrs/app/full?xrfkey=${xref}`;
    } else {
        // Get apps based on filter
        axiosConfig.url = `/qrs/app/full?filter=id%20eq%20${appIdsToGet.join('%20or%20id%20eq%20')}&xrfkey=${xref}`;

        // Debug
        node.log(`Filtering apps by ID: ${appIdsToGet.join(', ')}`);
        // node.log(`URL: ${axiosConfig.url}`);
    }

    try {
        // Get apps from Qlik Sense server
        const response = await axios.request(axiosConfig);

        // Ensure response status is 200
        if (response.status !== 200) {
            node.status({ fill: 'red', shape: 'ring', text: 'error getting apps' });
            node.log(`Error getting apps from Qlik Sense server: ${response.status} ${response.statusText}`);
            return null;
        }

        // Find app IDs that don't exist on Qlik Sense server
        const appIdNoExist = [];
        if (appIdsToGet !== undefined && appIdsToGet.length > 0) {
            appIdsToGet.forEach((appId) => {
                const app = response.data.find((a) => a.id === appId);
                if (app === undefined) {
                    appIdNoExist.push(appId);
                }
            });
        }

        // Return object containing apps, status and statusText
        return {
            app: response.data,
            appIdNoExist,
        };
    } catch (err) {
        // Log error
        node.error(`Error when getting apps: ${err}`);
        return null;
    }
}

// Function to delete apps on Qlik Sense server
// Parameters:
// - node: The node object
// - appIdsToDelete: Array of app ids
async function deleteApps(node, appIdsToDelete) {
    const { axiosConfig, xref } = getAuth(node);

    // Set up Axios for DELETE request
    axiosConfig.headers['Content-Type'] = 'application/json';
    axiosConfig.method = 'delete';

    // Array to hold deleted apps and app IDs that don't exist
    const appDeleted = [];
    const appIdNoExist = [];

    // Loop over array of app IDs and delete each app
    for (let i = 0; i < appIdsToDelete.length; i += 1) {
        // Get app ID to be deleted
        const appId = appIdsToDelete[i];

        // Verify that app to be deleted exists on Qlik Sense server
        let resExistingApp;
        try {
            // eslint-disable-next-line no-await-in-loop, prefer-destructuring
            resExistingApp = await getApps(node, undefined, [appId]);
        } catch (err) {
            // Log error
            node.error(`Error when getting app ${appId} from Qlik Sense server: ${err}`);
            return null;
        }

        // If app does not exist that is shown by the appIdNoExist array being non-empty
        // Add to appIdNoExist array and continue to next app
        if (resExistingApp.appIdNoExist.length > 0) {
            // The provided app IDs do not exist on the Qlik Sense server
            appIdNoExist.push(appId);
        } else {
            const existingApp = resExistingApp.app[0];

            // Build URL
            axiosConfig.url = `/qrs/app/${appId}?xrfkey=${xref}`;

            let response;
            try {
                // Make REST call to QRS API
                // eslint-disable-next-line no-await-in-loop
                response = await axios.request(axiosConfig);
            } catch (err) {
                // Log error
                node.error(`Error when deleting app ${appId} ("${existingApp.name}") on Qlik Sense server: ${err}`);
                return null;
            }

            // Ensure response status is 204
            if (response.status !== 204) {
                node.status({ fill: 'red', shape: 'ring', text: 'error deleting app' });
                node.log(`Error deleting app on Qlik Sense server: ${response.status} ${response.statusText}`);
                throw new Error(
                    `Error deleting app ${appId} ("${existingApp.name}") on Qlik Sense server: ${response.status} ${response.statusText}`
                );
            } else {
                // Add deleted app to appDeleted array
                appDeleted.push(existingApp);
            }
        }
    }

    return {
        appDeleted,
        appIdNoExist,
    };
}

// Function to duplicate apps on Qlik Sense server
// Parameters:
// - node: the node object
// - apps: an array of app objects, including the new app name
//   - sourceAppId: the source app object. Mandatory.
//   - newAppName: the name of the new app. Optional. If not specified, the new app name will be the source app name + '_copy_' + timestamp in "YYYY-MM-DD_HH-MM-SS" format
//   - includeCustomProperties: Optional. Whether to include custom properties. Optional. Default is false.
async function duplicateApps(node, apps) {
    const { axiosConfig, xref } = getAuth(node);

    // Set up Axios for POST request
    axiosConfig.headers['Content-Type'] = 'application/json';
    axiosConfig.method = 'post';

    // Array to hold newley created app objects and app IDs that don't exist
    const appCreated = [];
    const appIdNoExist = [];

    // Loop through apps array and duplicate each app
    for (let i = 0; i < apps.length; i += 1) {
        // Verify that app to be duplicated exists on Qlik Sense server
        const duplInfo = apps[i];

        // Get app id
        const appId = duplInfo.sourceAppId;

        let resExistingApp;
        try {
            // eslint-disable-next-line no-await-in-loop, prefer-destructuring
            resExistingApp = await getApps(node, undefined, [appId]);
        } catch (err) {
            // Log error
            node.error(`Error when getting app ${appId} from Qlik Sense server: ${err}`);
            return null;
        }

        // Debug
        // node.log(`resExistingApp: ${JSON.stringify(resExistingApp, null, 2)}`);

        // If app does not exist that is shown by the appIdNoExist array being non-empty
        // Add to appIdNoExist array and continue to next app
        if (resExistingApp.appIdNoExist.length > 0) {
            // The provided app IDs do not exist on the Qlik Sense server
            appIdNoExist.push(appId);
        } else {
            const existingApp = resExistingApp.app[0];
            // Debug
            // node.log(`existingApp: ${JSON.stringify(existingApp, null, 2)}`);

            // If newAppName does not exist in app object, create a new name consisting of source app name + '_copy_' + timestamp in "YYYY-MM-DD_HH-MM-SS" format
            let newAppName;
            if (duplInfo.newAppName === undefined) {
                const date = new Date();
                const timestampString = date.toISOString().replace(/:/g, '-').replace(/\./g, '-').replace('T', '_').replace('Z', '');
                newAppName = `${existingApp.name}_copy_${timestampString}`;
            } else {
                newAppName = duplInfo.newAppName;
            }

            // If includecustomproperties is not specified, default to false
            let includeCustomProperties;
            if (duplInfo.includeCustomProperties === undefined) {
                includeCustomProperties = false;
            } else {
                includeCustomProperties = duplInfo.includeCustomProperties;
            }

            // Build URL
            axiosConfig.url = `/qrs/app/${existingApp.id}/copy?name=${newAppName}&includecustomproperties=${includeCustomProperties}&xrfkey=${xref}`;

            // Debug
            // node.log(`URL: ${axiosConfig.url}`);

            let response;
            try {
                // Make REST call to QRS API
                // eslint-disable-next-line no-await-in-loop
                response = await axios.request(axiosConfig);
            } catch (err) {
                // Log error
                node.error(`Error when duplicating app ${existingApp.id} ("${existingApp.name}") on Qlik Sense server: ${err}`);
                return null;
            }

            // Ensure response status is 201
            if (response.status !== 201) {
                node.status({ fill: 'red', shape: 'ring', text: 'error duplicating app' });
                node.log(`Error duplicating app on Qlik Sense server: ${response.status} ${response.statusText}`);
                throw new Error(
                    `Error duplicating app ${existingApp.id} ("${existingApp.name}") on Qlik Sense server: ${response.status} ${response.statusText}`
                );
            } else {
                // Add new app to appCreated array
                appCreated.push(response.data);
            }
        }
    }

    // Return object containing creaeted apps, status and statusText
    return {
        appCreated,
        appIdNoExist,
    };
}

// Function to update apps on Qlik Sense server
// Parameters:
// - node: the node object
// - apps: an array of app objects, including the new metadata
async function updateApps(node, apps) {
    const { axiosConfig, xref } = getAuth(node);

    // Set up Axios for PUT request
    axiosConfig.headers['Content-Type'] = 'application/json';
    axiosConfig.method = 'put';

    // Array to hold updated apps and apps that don't exist
    const appUpdated = [];
    const appIdNoExist = [];

    // Get new metadata from apps.newData
    const { newData } = apps;

    // Loop through apps array and update each app
    // apps.app contains an array of objects, each with properties
    // - id: app ID
    let existingApp;
    for (let i = 0; i < apps.app.length; i += 1) {
        // Get app id
        const appId = apps.app[i].id;

        // Log progress
        node.log(`Starting update of app ${appId} on Qlik Sense server.`);

        // Get current app from Qlik Sense server
        let resExistingApp;
        try {
            // eslint-disable-next-line no-await-in-loop, prefer-destructuring
            resExistingApp = await getApps(node, undefined, [appId]);
        } catch (err) {
            // Log error
            node.error(`Error when getting app ${appId} from Qlik Sense server: ${err}`);
            return null;
        }

        // Debug resexistingapp
        // node.log(`resExistingApp: ${JSON.stringify(resExistingApp, null, 2)}`);

        // If app does not exist that is shown by the appIdNoExist array being non-empty
        // Add to appIdNoExist array and continue to next app
        if (resExistingApp.appIdNoExist.length > 0) {
            // The provided app IDs do not exist on the Qlik Sense server
            appIdNoExist.push(appId);
        } else {
            // Body of PUT request that will eventually be sent to QRS API
            const body = {};

            // Get existing app object
            // eslint-disable-next-line prefer-destructuring
            existingApp = resExistingApp.app[0];

            // Build URL for update request
            axiosConfig.url = `/qrs/app/${appId}?xrfkey=${xref}`;

            // Build body to send to QRS API in PUT request
            // The existing app's modifiedDate property is required
            body.modifiedDate = existingApp.modifiedDate;

            // Add new metadata (when provided as parameter) to app object
            // App name
            if (newData.name !== undefined) {
                body.name = newData.name;
            }

            // App description
            if (newData.description !== undefined) {
                body.description = newData.description;
            }

            // Is there a tag array in newData?
            // Make sure it's an array
            if (newData.tag !== undefined && Array.isArray(newData.tag)) {
                // Get existing tags for the app
                // eslint-disable-next-line no-await-in-loop
                const existingTagsArray = (await getAppTags(node, existingApp.id)).appTags;

                // Debug logging
                // node.log(`Existing tags for app ${existingApp.id} ("${existingApp.name}"): ${JSON.stringify(existingTagsArray)}`);

                // Get complete set of tags available on the Qlik Sense server
                // Keep properties "id" and "name" only
                // eslint-disable-next-line no-await-in-loop
                const allTagsArray = (await getTags(node)).tag.map((tag) => ({ id: tag.id, name: tag.name }));

                // Debug logging
                // node.log(`All tags on Qlik Sense server: ${JSON.stringify(allTagsArray)}`);

                // Make sure all tags in newData.tag exist on the Qlik Sense server
                // Use tag name to assert existence
                // If tag name does not exist, throw error
                for (let j = 0; j < newData.tag.length; j += 1) {
                    // Get tag name from newData.tag[j]
                    const tagName = newData.tag[j];

                    // Find tag in allTagsArray
                    const tag = allTagsArray.find((t) => t.name === tagName);

                    // If tag is not found, throw error
                    if (tag === undefined) {
                        node.status({ fill: 'red', shape: 'ring', text: 'error updating app: invalid tag' });
                        node.log(
                            `Error updating app ${existingApp.id} ("${existingApp.name}") on Qlik Sense server: invalid tag "${tagName}"`
                        );
                        throw new Error(
                            `Error updating app ${existingApp.id} ("${existingApp.name}") on Qlik Sense server: invalid tag "${tagName}"`
                        );
                    }
                }

                // Build array of tags to add to app
                // Use properties "id" and "name" for each tag.
                // If tag name is specified, use it to find the tag ID.
                // If tag name is not specified, use the tag ID.
                const tagsToAdd = [];
                for (let j = 0; j < newData.tag.length; j += 1) {
                    // Get tag name from newData.tag[j]
                    const tagName = newData.tag[j];

                    // Find tag ID in allTagsArray
                    const tagId = allTagsArray.find((tag) => tag.name === tagName).id;

                    // Build tag object
                    const tag = {
                        id: tagId,
                        name: tagName,
                    };

                    // Add tag object to tagsToAdd array
                    tagsToAdd.push(tag);
                }
                // Debug
                // node.log(`Tags to add to app ${existingApp.id} ("${existingApp.name}"): ${JSON.stringify(tagsToAdd, null, 2)}`);

                // Add new tags to existing tags
                const updatedTagsArray = existingTagsArray.concat(tagsToAdd);

                // Debug
                // node.log(`Updated tags for app ${existingApp.id} ("${existingApp.name}"): ${JSON.stringify(updatedTagsArray, null, 2)}`);

                // Remove duplicate tags using tag id as key
                const updatedTagsArrayUnique = updatedTagsArray.filter(
                    (tag, index, self) => self.findIndex((t) => t.id === tag.id) === index
                );

                // Only keep id and name properties of each object in array
                updatedTagsArrayUnique.forEach((tag) => {
                    // eslint-disable-next-line no-param-reassign
                    delete tag.privileges;
                });

                // Debug
                // node.log(
                //     `Updated tags for app ${existingApp.id} ("${existingApp.name}") (unique): ${JSON.stringify(
                //         updatedTagsArrayUnique,
                //         null,
                //         2
                //     )}`
                // );

                // Replace app object's tags array with updatedTagsArray
                body.tags = updatedTagsArrayUnique;
            }

            // Set body of Axios config
            axiosConfig.data = body;

            // Debug logging
            // Show payload to QRS API
            node.log(`Payload to QRS API: ${JSON.stringify(axiosConfig.data, null, 2)}`);

            let response;
            try {
                // Make REST call to QRS API
                // eslint-disable-next-line no-await-in-loop
                response = await axios.request(axiosConfig);
            } catch (err) {
                // Log error
                node.error(`Error when updating app ${appId} ("${existingApp.name}") on Qlik Sense server: ${err}`);
                return null;
            }

            // Ensure response status is 200
            if (response.status !== 200) {
                node.status({ fill: 'red', shape: 'ring', text: 'error updating app' });
                node.log(
                    `Error updating app on Qlik Sense server: ${response.status} ${response.statusText}, ${JSON.stringify(response.data)}`
                );
                throw new Error(
                    `Error updating app ${existingApp.id} ("${existingApp.name}") on Qlik Sense server: ${response.status} ${
                        response.statusText
                    }, ${JSON.stringify(response.data)}`
                );
            } else {
                // Log success
                node.log(`Updated app ${existingApp.id} ("${existingApp.name}") on Qlik Sense server.`);
                appUpdated.push(response.data);
            }
        }
    }

    // Return object containing updated apps, status and statusText
    return {
        appUpdated,
        appIdNoExist,
    };
}

module.exports = {
    getApps,
    deleteApps,
    duplicateApps,
    updateApps,
};
