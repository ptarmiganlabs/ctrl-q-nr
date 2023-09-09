const { getCandidateTags } = require('../lib/qseow/tagconfig');
const { getTags, createTags, deleteTags } = require('../lib/qseow/tag');

// eslint-disable-next-line func-names
module.exports = function (RED) {
    function QseowTag(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        // Get data from node configuration
        node.senseServer = RED.nodes.getNode(config.server);
        node.op = config.op || 'r';
        node.tagName = config.tagName || '';
        node.tagSource = config.tagSource || '';

        node.on('input', async (msg, send, done) => {
            try {
                const outMsg1 = {
                    payload: {},
                };

                // Get candidate tag names
                const res = getCandidateTags(node, done, msg);
                if (res === null) {
                    // Nothing to do
                    return;
                }

                const { tagNameCandidates } = res;

                // Log the tag names
                node.log(`Tag names for operation "${node.op}": ${tagNameCandidates}`);

                // Which operation should we perform?
                if (node.op === 'c') {
                    // Create tags
                    node.log('Creating tags on Qlik Sense server...');
                    node.status({ fill: 'yellow', shape: 'dot', text: 'creating tags' });

                    const result = await createTags(node, done, tagNameCandidates);

                    if (result !== null) {
                        // Build outMsg1
                        outMsg1.payload.tagCreated = result.tagCreated;
                        outMsg1.payload.tagExist = result.tagExist;

                        // Send outMsg11
                        node.send(outMsg1);
                    } else {
                        // Error creating tags
                        node.status({ fill: 'red', shape: 'ring', text: 'error creating tags' });
                        node.log('Error creating tags.');
                        done('Error creating tags.');
                        return;
                    }

                    // Log success
                    node.log(`Created tags: ${outMsg1.payload.tagCreated}`);
                    node.log(`Tags that already exist on server: ${outMsg1.payload.tagExist}`);
                    node.status({ fill: 'green', shape: 'dot', text: 'tags created' });
                } else if (node.op === 'r') {
                    // Read tags
                    node.log('Getting tags from Qlik Sense server...');
                    node.status({ fill: 'yellow', shape: 'dot', text: 'getting tags' });

                    const result = await getTags(node, done, tagNameCandidates);

                    if (result !== null) {
                        // Build outMsg1
                        outMsg1.payload.tag = result.tag;
                        outMsg1.payload.tagNameNoExist = result.tagNameNoExist;

                        // Send outMsg11
                        node.send(outMsg1);
                    } else {
                        // Error getting tags
                        node.status({ fill: 'red', shape: 'ring', text: 'error getting tags' });
                        node.log('Error getting tags.');
                        done('Error getting tags.');
                        return;
                    }
                    // Log success
                    node.log(`Found ${outMsg1.payload.tag.length} tags on Qlik Sense server.`);
                    node.log(`${outMsg1.payload.tagNameNoExist.length} of the provided tags don't exist on Qlik Sense server.`);
                    node.status({ fill: 'green', shape: 'dot', text: 'tags retrieved' });
                } else if (node.op === 'u') {
                    // Update tags
                } else if (node.op === 'd') {
                    // Delete tags
                    node.log('Deleting tags on Qlik Sense server...');
                    node.status({ fill: 'yellow', shape: 'dot', text: 'deleting tags' });

                    const result = await deleteTags(node, done, tagNameCandidates);

                    if (result !== null) {
                        // Build outMsg1
                        outMsg1.payload.tagDeleted = result.tagDeleted;
                        outMsg1.payload.tagNameNoExist = result.tagNameNoExist;

                        // Send outMsg11
                        node.send(outMsg1);
                    } else {
                        // Error deleting tags
                        node.status({ fill: 'red', shape: 'ring', text: 'error deleting tags' });
                        node.log('Error deleting tags.');
                        done('Error deleting tags.');
                        return;
                    }

                    // Log success
                    node.log(`Deleted tags: ${outMsg1.payload.tagDeleted}`);
                    node.log(`Tags that did not exist on server: ${outMsg1.payload.tagNoExist}`);
                    node.status({ fill: 'green', shape: 'dot', text: 'tags deleted' });
                } else {
                    // Invalid operation. Log error and return
                    node.error(`Invalid operation: ${node.op}`);
                    done(`Invalid operation: ${node.op}`);
                    return;
                }

                // Wrap up
                done();
            } catch (error) {
                node.status({ fill: 'red', shape: 'ring', text: 'error getting tags' });
                node.log(`Error getting tags from Qlik Sense server: ${error}`);
                done(error);
            }
        });
    }

    RED.nodes.registerType('qseow-tag', QseowTag, {
        defaults: {
            senseServer: { value: '', type: 'qseow-sense-server', required: true },
            tagNames: { value: [], required: false },
        },
    });
};
