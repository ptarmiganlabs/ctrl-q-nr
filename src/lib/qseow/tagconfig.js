// Function to get candiate tags from either incoming message or predefined list in node config
// Return an object that contains the various yask candidates
function getCandidateTags(node, done, msg) {
    let tagNameCandidates = [];

    // Where should we get the tag identifiers from?
    if (node.tagSource === 'predefined') {
        // Use the tags in the node configuration
        // Break the \n separated list of tags into an array
        let tagsPredefined = node.tagName.split('\n');

        // Remove any empty elements from the arrayy
        tagsPredefined = tagsPredefined.filter((el) => el !== '');

        // Remove any rows that have # (comment) as first non-whitespace or space character
        tagsPredefined = tagsPredefined.filter((el) => !el.match(/^\s*#/));

        // Use the tag names in the node configuration
        // Log the tag names
        node.log(`Predefined tag names: ${tagsPredefined}`);

        // Were there any tag names specified?
        if (tagsPredefined.length === 0) {
            tagNameCandidates = [];
        } else {
            tagsPredefined.forEach((tagName) => {
                tagNameCandidates.push(tagName);
            });
        }
    } else if (node.tagSource === 'msg-in') {
        let tagsIncoming;

        // Use the tag names in the incoming message
        // Ensure that
        // 1. msg.payload exists
        // 2. msg.payload.tagName exists
        // 3. msg.payload.tagName is an array
        if (msg.payload && msg.payload.tagName && Array.isArray(msg.payload.tagName)) {
            tagsIncoming = msg.payload.tagName;
        } else {
            // Log error
            node.status({ fill: 'green', shape: 'dot', text: 'nothing to do' });
            done('Incoming message did not contain an array of tag names.');
            return null;
        }

        // Use the tag names in the incoming message
        // Log the tag names
        node.log(`Incoming tag names: ${tagsIncoming}`);

        // Were there any tag names specified?
        if (tagsIncoming.length === 0) {
            tagNameCandidates = [];
        } else {
            tagsIncoming.forEach((tagName) => {
                tagNameCandidates.push(tagName);
            });
        }
    } else {
        // Log error
        node.log(`Invalid tag source: "${node.tagSource1}"`);
        node.status({ fill: 'red', shape: 'ring', text: 'invalid tag source' });
        done(`Invalid tag source: "${node.tagSource1}"`);
        return null;
    }

    // Return the tag names
    return { tagNameCandidates };
}

module.exports = {
    getCandidateTags,
};
