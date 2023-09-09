// Function to get candiate tasks from either incoming message or predefined list in node config
// Return an object that contains the various yask candidates
function getCandidateTasks(node, done, msg) {
    let taskIdCandidates = [];

    // Where should we get the task identifiers from?
    if (node.taskSource === 'predefined') {
        let taskIdsPredefined;

        // Use the tasks in the node configuration
        // Break the \n separated list of tasks into an array
        taskIdsPredefined = node.taskId.split(/\r?\n/);

        // Remove any empty elements from the arrayy
        taskIdsPredefined = taskIdsPredefined.filter((el) => el !== '');

        // Remove any rows that have # (comment) as first non-whitespace or space character
        taskIdsPredefined = taskIdsPredefined.filter((el) => !el.match(/^\s*#/));

        // Use the task IDs in the node configuration
        // Log the task IDs
        node.log(`Predefined task IDs: ${taskIdsPredefined}`);

        // Were there any task IDs specified?
        if (taskIdsPredefined.length === 0) {
            taskIdCandidates = [];
        } else {
            taskIdsPredefined.forEach((taskId) => {
                taskIdCandidates.push(taskId);
            });
        }
    } else if (node.taskSource === 'msg-in') {
        let tasksIncoming;

        // Use the task ids in the incoming message
        // Ensure that
        // 1. msg.payload exists
        // 2. msg.payload.taskId exists
        // 3. msg.payload.taskId is an array
        if (msg.payload && msg.payload.taskId && Array.isArray(msg.payload.taskId)) {
            tasksIncoming = msg.payload.taskId;
        } else {
            // Log error
            node.status({ fill: 'red', shape: 'ring', text: 'nothing to do' });
            done('Incoming message did not contain an array of task IDs.');
            return;
        }

        // Use the task IDs in the incoming message
        // Log the task IDs
        node.log(`Incoming task IDs: ${tasksIncoming}`);

        // Were there any task IDs specified?
        if (tasksIncoming.length === 0) {
            taskIdCandidates = [];
        } else {
            tasksIncoming.forEach((taskId) => {
                taskIdCandidates.push(taskId);
            });
        }
    } else {
        // Log error
        node.log(`Invalid task source: "${node.taskSource1}"`);
        node.status({ fill: 'red', shape: 'ring', text: 'invalid task source' });
        done(`Invalid task source: "${node.taskSource1}"`);
        return;
    }

    // Return the task IDs
    // eslint-disable-next-line consistent-return
    return { taskIdCandidates };
}

module.exports = {
    getCandidateTasks,
};
