/* eslint-disable no-await-in-loop */

// Function to get all users and their associated metadata
// Parameters:
// node: node object
// qlik: authentication object
//
// Return
// Success: An array of user objects
// Failure: false
async function getUsers(node, qlik) {
    let allItems = [];
    try {
        const items = await qlik.users.getUsers({ limit: 100 });

        // eslint-disable-next-line no-restricted-syntax
        for await (const item of items.pagination) {
            allItems.push(item);
        }
    } catch (error) {
        node.log(`Error getting users: ${error}`);
        allItems = false;
    }

    // Return the spaces' metadata
    return allItems;
}

// Make the function available to other files
module.exports = {
    getUsers,
};
