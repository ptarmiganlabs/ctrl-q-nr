/* eslint-disable no-await-in-loop */
const { getAllSpaces } = require('./space');

// Function to get all apps and their associated metadata
// Parameters:
// qlik: authentication object
//
// Return
// Success: An array of app objects
// Failure: false
async function getAllApps(qlik) {
    let allItems = [];
    try {
        const items = await qlik.items.getItems({ resourceType: 'app', limit: 100 });

        // Paginate through the results
        // eslint-disable-next-line no-restricted-syntax
        for await (const item of items.pagination) {
            allItems.push(item);
        }
    } catch (error) {
        allItems = false;
    }

    // Return the apps' metadata
    return allItems;
}

// Function to look up apo IDs given app names, colletion names or managed space names
// Parameters:
// node: node object
// qlik: authentication object
// lookupSource: object containing entities to look up and translate into app IDs
//
// Return
// Success: An object containing an array of unique app IDs and an array of unique app objects
// Failure: false
async function lookupAppId(node, qlik, lookupSource) {
    const allAppIds = [];
    const allAppObjects = [];

    // Get all apps.
    const allApps = await getAllApps(qlik);

    // Did we get any apps? If not, report error and return
    // Also make sure we got an array
    if (!allApps || !Array.isArray(allApps)) {
        node.log('Error getting apps in lookupAppId');
        node.status({ fill: 'red', shape: 'ring', text: 'error getting apps' });
        return false;
    }

    // Qlik SaaS APIs don't have a good filtering mechanism, so we'll have to filter the results ourselves.

    // lookupSource.appName is an array of app names.
    // We'll iterate through the array and look for apps with matching names.
    // Save the app IDs to the allAppIds array.
    if (lookupSource.appName) {
        try {
            // Iterate through the array of app names
            lookupSource.appName.forEach((appName) => {
                // Iterate through the array of apps
                allApps.forEach((app) => {
                    // Does the app name match?
                    if (app.name === appName) {
                        // Yes. Save the app ID to the allAppIds array
                        allAppIds.push(app.id);
                        allAppObjects.push(app);
                    }
                });
            });
        } catch (error) {
            node.log(`Error looking up app name: ${error}`);
            node.status({ fill: 'red', shape: 'ring', text: 'error looking up app name' });
            return false;
        }
    }

    // lookupSource.spaceName is an array of space names.
    // We'll iterate through the array and look for apps that are in the spaces.
    // Save the app IDs to the allAppIds array.
    if (lookupSource.spaceName) {
        try {
            // Get all spaces
            const allSpaces = await getAllSpaces(node, qlik);

            // Did we get any spaces? If not, report error and return
            // Also make sure we got an array
            if (!allSpaces || !Array.isArray(allSpaces)) {
                node.log('Error getting spaces in lookupAppId');
                node.status({ fill: 'red', shape: 'ring', text: 'error getting spaces' });
                return false;
            }

            // Iterate through the array of space names
            lookupSource.spaceName.forEach((spaceName) => {
                // Iterate through the array of spaces
                allSpaces.forEach((space) => {
                    // Does the space name match?
                    if (space.name === spaceName) {
                        // Yes. Get the ID of this space
                        const spaceId = space.id;

                        // Get all apps in this space
                        // Each app object has an attribute called resourceAttributes.spaceId
                        // that is set to the space ID if the app is part of a space
                        const appsInSpace = allApps.filter((app) => app.resourceAttributes.spaceId === spaceId);

                        // Save the app IDs to the allAppIds array
                        appsInSpace.forEach((app) => {
                            allAppIds.push(app.id);
                            allAppObjects.push(app);
                        });
                    }
                });
            });
        } catch (error) {
            node.log(`Error looking up space name: ${error}`);
            node.status({ fill: 'red', shape: 'ring', text: 'error looking up space name' });
            return false;
        }
    }

    // Remove duplicates from the allAppIds array
    const uniqueAppIds = [...new Set(allAppIds)];

    // Get the app objects for the unique app IDs
    const uniqueAppObjects = [];

    // Make sure we got an array
    if (!uniqueAppIds || !Array.isArray(uniqueAppIds)) {
        node.log('Error getting unique app IDs in lookupAppId');
        node.status({ fill: 'red', shape: 'ring', text: 'error getting unique app IDs' });
        return false;
    }

    uniqueAppIds.forEach((appId) => {
        const appObject = allAppObjects.find((app) => app.id === appId);
        uniqueAppObjects.push(appObject);
    });

    return { uniqueAppIds, uniqueAppObjects };
}

// Make the function available to other files
module.exports = {
    lookupAppId,
    getAllApps,
};
