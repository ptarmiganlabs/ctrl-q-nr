// Function to get candiate app IDs from either incoming message or predefined list in node config
// Return an object that contains the various task candidates
function getCandidateAppsPredefAndIncoming(node, done, msg) {
    let appIdCandidates = [];

    // Debug node.appSource1
    // node.log(`node.appSource1: ${node.appSource1}`);
    // node.log(`node.appSource2: ${node.appSource2}`);
    // node.log(`node.op: ${node.op}`);
    // node.log(`node.appSource: ${node.appSource}`);

    // Where should we get the app identifiers from?
    if (node.appSource === 'msg-in') {
        let appIdsIncoming;

        // Different operations may have different structures for the incoming message
        // Operation get-script
        if (node.op === 'get-script') {
            // Msg payload should have a property called "app", which is an array of objects
            // Each object has a property called "id"
            // Ensure that
            // 1. msg.payload exists
            // 2. msg.payload.app exists
            // 3. msg.payload.app is an array
            if (msg.payload && msg.payload.app && Array.isArray(msg.payload.app)) {
                appIdCandidates = msg.payload.app.map((app) => app.id);
            } else {
                // Log error
                node.status({ fill: 'red', shape: 'ring', text: 'invalid incoming message' });
                done('Incoming message did not contain an array of app ids.');
                return null;
            }
        } else {
            // Use the app ids in the incoming message
            // Ensure that
            // 1. msg.payload exists
            // 2. msg.payload.appId exists
            // 3. msg.payload.appId is an array
            if (msg.payload && msg.payload.appId && Array.isArray(msg.payload.appId)) {
                appIdsIncoming = msg.payload.appId;
            } else {
                // Log error
                node.status({ fill: 'red', shape: 'ring', text: 'invalid incoming message' });
                done('Incoming message did not contain an array of app ids.');
                return null;
            }

            // Use the app ids in the incoming message
            // Log the app ids
            node.log(`Incoming app ids: ${appIdsIncoming}`);

            // Were there any app ids specified?
            if (appIdsIncoming.length === 0) {
                appIdCandidates = [];
            } else {
                appIdsIncoming.forEach((appId) => {
                    appIdCandidates.push(appId);
                });
            }
        }
    } else if (node.appSource === 'predefined') {
        // Use the app Ids in the node configuration
        // Break the \n separated list of app ids into an array
        let appIdsPredefined = node.appId.split(/\r?\n/);

        // Remove any empty elements from the arrayy
        appIdsPredefined = appIdsPredefined.filter((el) => el !== '');

        // Remove any rows that have # (comment) as first non-whitespace or space character
        appIdsPredefined = appIdsPredefined.filter((el) => !el.match(/^\s*#/));

        // Use the app ids in the node configuration
        // Log the app ids
        node.log(`Predefined app ids: ${appIdsPredefined}`);

        // Were there any app ids specified?
        if (appIdsPredefined.length === 0) {
            appIdCandidates = [];
        } else {
            appIdsPredefined.forEach((appId) => {
                appIdCandidates.push(appId);
            });
        }
    } else {
        // Log error
        node.log(`Invalid app source: "${node.appSource}"`);
        node.status({ fill: 'red', shape: 'ring', text: 'invalid app source' });
        done(`Invalid app source: "${node.appSource}"`);
        return null;
    }

    // Return the app ids
    return { appIdCandidates };
}

module.exports = {
    getCandidateAppsPredefAndIncoming,
};
