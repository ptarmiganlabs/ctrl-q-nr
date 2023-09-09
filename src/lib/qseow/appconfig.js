// Function to get candiate app IDs from either incoming message or predefined list in node config
// Return an object that contains the various task candidates
function getCandidateAppsPredefAndIncoming(node, done, msg) {
    let appIdCandidates = [];

    // Where should we get the app identifiers from?
    if (node.appSource1 === 'msg-in') {
        let appIdsIncoming;

        // Use the app ids in the incoming message
        // Ensure that
        // 1. msg.payload exists
        // 2. msg.payload.appId exists
        // 3. msg.payload.appId is an array
        if (msg.payload && msg.payload.appId && Array.isArray(msg.payload.appId)) {
            appIdsIncoming = msg.payload.appId;
        } else {
            // Log error
            node.status({ fill: 'green', shape: 'dot', text: 'nothing to do' });
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
    } else if (node.appSource1 === 'predefined') {
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
        node.log(`Invalid app source: "${node.appSource1}"`);
        node.status({ fill: 'red', shape: 'ring', text: 'invalid app source' });
        done(`Invalid app source: "${node.appSource1}"`);
        return null;
    }

    // Return the app ids
    return { appIdCandidates };
}

module.exports = {
    getCandidateAppsPredefAndIncoming,
};
