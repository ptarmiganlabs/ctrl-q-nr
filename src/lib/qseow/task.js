const axios = require('axios');

const { getTaskTags } = require('./tag');
const { getAuth } = require('./auth');

// Function to get tasks from Qlik Sense server, based on task names
// Parameters:
// - node: the node object
// - taskNames: an array of task names
// Return: an object containing an array of task objects
async function getTasksByName(node, taskNames) {
    // Make sure appNames is an array
    if (!Array.isArray(taskNames)) {
        node.status({ fill: 'red', shape: 'ring', text: 'error getting tasks by name' });
        node.log(`Error getting tasks from Qlik Sense server: taskNames is not an array.`);
        return null;
    }

    try {
        // Set up authentication
        const { axiosConfig, xref } = getAuth(node);

        // Build url that can be used with QRS API. Quote task names with single quotes
        axiosConfig.url = `/qrs/task/full?filter=name%20eq%20'${taskNames.join(`'%20or%20name%20eq%20'`)}'&xrfkey=${xref}`;

        // Debug url
        node.log(`URL: ${axiosConfig.url}`);

        // Get tasks from Qlik Sense server
        const response = await axios(axiosConfig);

        // Ensure response status is 200
        if (response.status !== 200) {
            node.status({ fill: 'red', shape: 'ring', text: 'error getting tasks by name' });
            node.log(`Error getting tasks from Qlik Sense server: ${response.status} ${response.statusText}`);
            return null;
        }

        // Return object containing an array of task objects
        return {
            task: response.data,
        };
    } catch (err) {
        // Log error
        node.error(`Error when getting tasks by name: ${err}`);
        return null;
    }
}

// Function to get tasks from Qlik Sense server, based on tag names
// Parameters:
// - node: the node object
// - tagNames: an array of tag names
// Return: an object called "tag" containing an array of task objects
async function getTasksByTagName(node, tagNames) {
    // Make sure tagNames is an array
    if (!Array.isArray(tagNames)) {
        node.status({ fill: 'red', shape: 'ring', text: 'error getting tasks by tag name' });
        node.log(`Error getting tasks from Qlik Sense server: tagNames is not an array.`);
        return null;
    }

    try {
        // Set up authentication
        const { axiosConfig, xref } = getAuth(node);

        // Build url that can be used with QRS API. Quote task names with single quotes
        axiosConfig.url = `/qrs/task/full?filter=tags.name%20eq%20'${tagNames.join(`'%20or%20tags.name%20eq%20'`)}'&xrfkey=${xref}`;

        // Debug url
        node.log(`URL: ${axiosConfig.url}`);

        // Get tasks from Qlik Sense server
        const response = await axios(axiosConfig);

        // Ensure response status is 200
        if (response.status !== 200) {
            node.status({ fill: 'red', shape: 'ring', text: 'error getting tasks by tag name' });
            node.log(`Error getting tasks from Qlik Sense server: ${response.status} ${response.statusText}`);
            return null;
        }

        // Return object containing an array of task objects
        return {
            task: response.data,
        };
    } catch (err) {
        // Log error
        node.error(`Error when getting tasks by tag name: ${err}`);
        return null;
    }
}

// Function to start tasks on Qlik Sense server
// Parameters:
// - node: the node object
// - done: the done function
// - taskIdsToStart: an array of task IDs to start
async function startTasks(node, done, taskIdsToStart) {
    // Set up authentication
    const { axiosConfig, xref } = getAuth(node);

    const reloadTaskToStart = [];
    const externalProgramTaskToStart = [];
    const distributionTaskToStart = [];
    const userSyncTaskToStart = [];
    const taskIdNoExist = [];

    // Check which of the task IDs are reload tasks, external program tasks, distribution tasks, or user sync tasks

    // Concatenate task IDs to filter string that can be used with QRS API
    let filterString = '';
    taskIdsToStart.forEach((taskId) => {
        filterString += `id eq ${taskId} or `;
    });
    filterString = filterString.slice(0, -4);

    // Build final Axios config
    axiosConfig.url = `/qrs/task/full?filter=${filterString}&xrfkey=${xref}`;

    // Debug
    // node.log(`URL: ${axiosConfig.url}`);
    // node.log(`Method: ${axiosConfig.method}`);
    // node.log(`Headers: ${JSON.stringify(axiosConfig.headers, null, 4)}`);
    // End debug

    let response;
    try {
        response = await axios(axiosConfig);
    } catch (err) {
        // Log error
        node.error(`Error when getting task information: ${err}`);
        return null;
    }

    const allTasks = response.data;

    // Loop through all tasks
    allTasks.forEach((task) => {
        // Is this a reload task?
        if (task.taskType === 0) {
            reloadTaskToStart.push(task);
        } else if (task.taskType === 1) {
            // Is this an external program task?
            externalProgramTaskToStart.push(task);
        } else if (task.taskType === 2) {
            // Is this a distribution task?
            distributionTaskToStart.push(task);
        } else if (task.taskType === 3) {
            // Is this a user sync task?
            userSyncTaskToStart.push(task);
        } else {
            // Log error
            node.error(`Invalid task type: ${task.taskType}`);
        }
    });

    // Find any task ID that was not returned by the QRS API
    // Store those IDs in the taskIdNoExist array
    taskIdsToStart.forEach((taskId) => {
        let found = false;
        allTasks.forEach((task) => {
            if (task.id === taskId) {
                found = true;
            }
        });
        if (!found) {
            taskIdNoExist.push(taskId);
        }
    });

    // Log number of tasks to start
    node.log(`Number of reload tasks to start: ${reloadTaskToStart.length}`);
    node.log(`Number of external program tasks to start: ${externalProgramTaskToStart.length}`);
    node.log(`Number of distribution tasks to start: ${distributionTaskToStart.length}`);
    node.log(`Number of user sync tasks to start: ${userSyncTaskToStart.length}`);

    // Debug each array
    // node.log(`Reload tasks to start: ${JSON.stringify(reloadTaskToStart, null, 4)}`);
    // node.log(`External program tasks to start: ${JSON.stringify(externalProgramTaskToStart, null, 4)}`);
    // node.log(`Distribution tasks to start: ${JSON.stringify(distributionTaskToStart, null, 4)}`);
    // node.log(`User sync tasks to start: ${JSON.stringify(userSyncTaskToStart, null, 4)}`);
    // End debug

    // Concatenate all task IDs into single array
    const allTaskIds = [];
    reloadTaskToStart.forEach((task) => {
        allTaskIds.push(task.id);
    });
    externalProgramTaskToStart.forEach((task) => {
        allTaskIds.push(task.id);
    });
    distributionTaskToStart.forEach((task) => {
        allTaskIds.push(task.id);
    });
    userSyncTaskToStart.forEach((task) => {
        allTaskIds.push(task.id);
    });

    // Debug
    node.log(`Task IDs to start: ${allTaskIds}`);
    // End debug

    // Build URL etc
    // Start reload tasks using endpoint /qrs/task/start/many
    axiosConfig.url = `/qrs/task/start/many?xrfkey=${xref}`;
    axiosConfig.method = 'post';
    axiosConfig.data = allTaskIds;
    axiosConfig.headers['Content-Type'] = 'application/json';

    // Start tasks
    try {
        const response2 = await axios(axiosConfig);
        node.log(`Started ${allTaskIds.length} tasks.`);

        // Ensure response status is 204
        if (response2.status !== 204) {
            node.status({ fill: 'red', shape: 'ring', text: 'error starting tasks' });
            node.log(`Error starting reload tasks on Qlik Sense server: ${response.status} ${response.statusText}`);
            done(`Error starting reload tasks on Qlik Sense server: ${response.status} ${response.statusText}`);
            return null;
        }

        node.status({ fill: 'green', shape: 'dot', text: 'tasks started' });
        node.log(`${allTaskIds.length} tasks started on Qlik Sense server.`);
    } catch (err) {
        // Log error
        node.error(`Error when starting tasks: ${err}`);
    }

    // Return different task types separately
    return {
        reloadTaskToStart,
        externalProgramTaskToStart,
        distributionTaskToStart,
        userSyncTaskToStart,
        taskIdNoExist,
    };
}

// Function to look up task IDs given task names or tag names
// Parameters:
// - node: the node object
// - lookupSource: object containing entities to look up and translate into task IDs

// Return
// Success: An object containing an array of unique task IDs and an array of unique task objects
// Failure: false
async function lookupTaskId(node, lookupSource) {
    const allTaskIds = [];
    const allTaskObjects = [];

    // lookupSource.taskName is an array of task names
    // Build filter string that can be used with QRS API
    if (lookupSource.taskName) {
        // Get tasks from Qlik Sense server
        // Return a task property, which contains an array task objects
        const resTasks = await getTasksByName(node, lookupSource.taskName);

        // Make sure we got a response that contains the correct data
        if (!resTasks || !resTasks.task || !Array.isArray(resTasks.task)) {
            node.error('Error when getting tasks by name in lookupTaskIds()');
            node.status({ fill: 'red', shape: 'ring', text: 'error getting tasks by name' });
            return false;
        }

        // Loop through array of tasks and add task IDs to allTaskIds array
        resTasks.task.forEach((task) => {
            allTaskIds.push(task.id);
            allTaskObjects.push(task);
        });

        // Debug
        node.log(`allTaskIds: ${JSON.stringify(allTaskIds, null, 4)}`);
    }

    // lookupSource.tagName is an array of tag names
    // Build filter string that can be used with QRS API
    if (lookupSource.tagName) {
        // Get tasks from Qlik Sense server, based on which tag names they have
        const resTasks = await getTasksByTagName(node, lookupSource.tagName);

        // Make sure we got a response that contains the correct data
        if (!resTasks || !resTasks.task || !Array.isArray(resTasks.task)) {
            node.error('Error when getting tasks by tag name in lookupTaskIds()');
            node.status({ fill: 'red', shape: 'ring', text: 'error getting tasks by tag name' });
            return false;
        }

        // Loop through array of tasks and add task IDs to allTaskIds array
        resTasks.task.forEach((task) => {
            allTaskIds.push(task.id);
            allTaskObjects.push(task);
        });
    }

    // Remove duplicates from allTaskIds array
    const uniqueTaskIds = [...new Set(allTaskIds)];

    // Get the task objects for the unique task IDs
    const uniqueTaskObjects = [];

    // Make sure we got an array
    if (!uniqueTaskIds || !Array.isArray(uniqueTaskIds)) {
        node.error('Error when getting unique task IDs in lookupTaskIds()');
        node.status({ fill: 'red', shape: 'ring', text: 'error getting unique task IDs' });
        return false;
    }

    // Loop through array of unique task IDs and get the task objects
    uniqueTaskIds.forEach((taskId) => {
        const taskObject = allTaskObjects.find((task) => task.id === taskId);
        uniqueTaskObjects.push(taskObject);
    });

    // Return object containing unique task IDs and unique task objects
    return {
        uniqueTaskIds,
        uniqueTaskObjects,
    };
}

module.exports = {
    startTasks,
    lookupTaskId,
};
