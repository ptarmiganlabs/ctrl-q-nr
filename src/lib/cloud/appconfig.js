// Function to get candiate apps from either incoming message or predefined list in node config
// Return an object that contains the various app candidates
function getCandidateApps(node, msg, done) {
    let appIdCandidates = [];

    // Where should we get the app identifiers from?
    if (node.appSource1 === 'msg-in') {
        let appsIncoming;

        // Use the app ids in the incoming message
        // Ensure that
        // 1. msg.payload exists
        // 2. msg.payload.appId exists
        // 3. msg.payload.appId is an array
        if (msg.payload && msg.payload.appId && Array.isArray(msg.payload.appId)) {
            appsIncoming = msg.payload.appId;
        } else {
            // Log error
            node.status({ fill: 'red', shape: 'ring', text: 'nothing to do' });
            done('Incoming message did not contain an array of app IDs.');
            return;
        }

        // Use the app IDs in the incoming message
        // Log the app IDs
        node.log(`Incoming app IDs: ${appsIncoming}`);

        // Were there any app IDs specified?
        if (appsIncoming.length === 0) {
            appIdCandidates = [];
        } else {
            appsIncoming.forEach((appId) => {
                appIdCandidates.push(appId);
            });
        }
    } else if (node.appSource1 === 'predefined') {
        let appIdsPredefined;

        // Use the apps in the node configuration
        // Break the \n separated list of apps into an array
        appIdsPredefined = node.appId.split('\n');

        // Remove any empty elements from the arrayy
        appIdsPredefined = appIdsPredefined.filter((el) => el !== '');

        // Remove any rows that have # (comment) as first non-whitespace or space character
        appIdsPredefined = appIdsPredefined.filter((el) => !el.match(/^\s*#/));

        // Use the app IDs in the node configuration
        // Log the app IDs
        node.log(`Predefined app IDs: ${appIdsPredefined}`);

        // Were there any app IDs specified?
        if (appIdsPredefined.length === 0) {
            appIdCandidates = [];
        } else {
            appIdsPredefined.forEach((appId) => {
                appIdCandidates.push(appId);
            });
        }
    }

    // Return the app IDs
    // eslint-disable-next-line consistent-return
    return { appIdCandidates };
}

module.exports = {
    getCandidateApps,
};
