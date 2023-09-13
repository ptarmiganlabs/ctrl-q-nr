/* eslint-disable no-await-in-loop */

// Function to get all spaces and their associated metadata
// Parameters:
// node: node object
// qlik: authentication object
//
// Return
// Success: An array of space objects
// Failure: false
async function getAllSpaces(node, qlik) {
    let allItems = [];
    try {
        const items = await qlik.spaces.getSpaces({ limit: 100 });

        // eslint-disable-next-line no-restricted-syntax
        for await (const item of items.pagination) {
            allItems.push(item);
        }
    } catch (error) {
        node.log(`Error getting spaces: ${error}`);
        allItems = false;
    }

    // Return the spaces' metadata
    return allItems;
}

// Function to get all apps that are in a space
// Parameters:
// auth: authentication object
// spaceId: the ID of the space

// Return
// Success: An array of app objects
// Failure: false
async function getAppsInSpace(auth, spaceId) {
    let allItems = [];
    let path = `/items?resourceType=app&spaceId=${spaceId}`;

    // Loop until there are no more pages of results
    // eslint-disable-next-line no-constant-condition
    while (true) {
        try {
            // Parameters for the /items endpoint
            const params = {
                limit: 100,
            };

            const response = await auth.rest(path, params);
            const allApps = await response.json();

            // Push all objects to the allItems array
            // eslint-disable-next-line no-loop-func
            allApps.data.forEach((app) => {
                allItems.push(app);
            });

            // Are there more pages of results?
            if (!allApps.links.next || allApps.links.next === null) {
                // No more pages. Break out of the loop
                break;
            }

            // Build the path for the next page of results
            // Only use the path after the ..../api/v1 part
            // eslint-disable-next-line prefer-destructuring
            path = allApps.links.next.href.split('/api/v1')[1];
            // console.log(`next path: ${path}`);
        } catch (error) {
            allItems = false;
            break;
        }
    }

    // Return the apps' metadata
    return allItems;
}

// Make the function available to other files
module.exports = {
    getAllSpaces,
    getAppsInSpace,
};
