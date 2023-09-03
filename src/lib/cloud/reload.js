/* eslint-disable no-await-in-loop */
// Function to get all reloads from Qlik Sense Cloud
// Endpoint is /reloads
// Paginate through all reloads using the pagination link in the response
// The pagination link is in the links.next.href property of the response
async function getAllReloads(auth) {
    const allItems = [];
    let path = '/reloads';

    // eslint-disable-next-line no-constant-condition
    while (true) {
        const response = await auth.rest(path);
        const reloads = await response.json();

        // Push all objects to the allItems array
        reloads.data.forEach((reload) => {
            allItems.push(reload);
        });

        // Are there more pages of results?
        if (!reloads.links.next) {
            // No more pages. Break out of the loop
            break;
        }

        // Build the path for the next page of results
        // Only use the path after the ..../api/v1 part
        // eslint-disable-next-line prefer-destructuring
        path = reloads.links.next.href.split('/api/v1')[1];
        // console.log(`next path: ${path}`);
    }

    return allItems;
}

// Make the function available to other files
module.exports = { getAllReloads };
