const fs = require('fs');
const axios = require('axios');
const https = require('https');

const { getXref } = require('../misc/xref');
const { getHeaders } = require('./header');

// Function to start tasks on Qlik Sense server
// Parameters:
// - node: the node object
// - done: the done function
// - taskIdsToStart: an array of task IDs to start
async function startTasks(node, done, taskIdsToStart) {
    // Get xref string
    const xref = getXref(16);

    // Get headers
    const headers = getHeaders(xref);

    // Create httpsAgent
    const { authType } = node.senseServer;
    let httpsAgent;

    if (authType === 'cert') {
        const cert = fs.readFileSync(node.senseServer.certFile);
        const key = fs.readFileSync(node.senseServer.keyFile);
        httpsAgent = new https.Agent({
            cert,
            key,
            rejectUnauthorized: false,
        });
    } else if (authType === 'jwt') {
        const token = node.senseServer.jwt;
        headers.Authorization = `Bearer ${token}`;
    } else {
        // Invalid auth type. Log error to console, then throw error.
        node.error(`Invalid auth type: ${authType}`);
        throw new Error(`Invalid auth type: ${authType}`);
    }

    // Build Axios config
    const axiosConfig = {
        url: '',
        method: 'get',
        baseURL: `${node.senseServer.qrsProtocol}://${node.senseServer.qrsHost}:${node.senseServer.qrsPort}`,
        headers,
        timeout: 10000,
        responseType: 'json',
        httpsAgent,
    };

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

    // Build URL
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

module.exports = {
    startTasks,
};
