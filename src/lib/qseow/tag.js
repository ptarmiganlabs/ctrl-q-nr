const fs = require('fs');
const axios = require('axios');
const https = require('https');

const { getXref } = require('../misc/xref');
const { getHeaders } = require('./header');

// Function to get tags from Qlik Sense server
// Parameters:
// - node: the node object
// - done: the done function
// - tagsToGet: an array of tag names to get
async function getTags(node, done, tagNamesToGet) {
    // Clean up parameters
    if (tagNamesToGet === undefined) {
        // eslint-disable-next-line no-param-reassign
        tagNamesToGet = [];
    }

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
        baseURL: `${node.senseServer.protocol}://${node.senseServer.host}:${node.senseServer.port}`,
        headers,
        timeout: 10000,
        responseType: 'json',
        httpsAgent,
    };

    const tagRetrieved = [];
    const tagNameNoExist = [];

    // If tagNamesToGet is empty or missing, get all tags
    if (tagNamesToGet === undefined || tagNamesToGet.length === 0) {
        // Build URL
        axiosConfig.url = `/qrs/tag/full?xrfkey=${xref}`;
    } else {
        // Concatenate tag names to filter string that can be used with QRS API
        let filterString = '';
        tagNamesToGet.forEach((tagName) => {
            filterString += `name eq '${tagName}' or `;
        });
        filterString = filterString.slice(0, -4);

        // Build URL
        axiosConfig.url = `/qrs/tag/full?filter=(${filterString})&xrfkey=${xref}`;
    }
    // Debug URL
    node.log(`URL: ${axiosConfig.url}`);

    let response;
    try {
        response = await axios.request(axiosConfig);

        // Ensure response status is 200
        if (response.status !== 200) {
            node.status({ fill: 'red', shape: 'ring', text: 'error getting tags' });
            node.log(`Error getting tags from Qlik Sense server: ${response.status} ${response.statusText}`);
        } else {
            // Concatenate tag names to output array
            response.data.forEach((tag) => {
                tagRetrieved.push(tag);
            });

            // Find tags that were not found on the Sense server
            tagNamesToGet.forEach((tagName) => {
                const found = tagRetrieved.find((tag) => tag.name === tagName);

                if (!found) {
                    tagNameNoExist.push(tagName);
                }
            });
        }
    } catch (err) {
        // Log error
        node.error(`Error getting tags from Qlik Sense server: ${err}`);
        return null;
    }

    // Return object containing tags, status and statusText
    return {
        tag: tagRetrieved,
        tagNameNoExist,
    };
}

// Function to create tags on Qlik Sense server
// Parameters:
// - node: the node object
// - done: the done function
// - tagsToCreate: an array of tag names to create
async function createTags(node, done, tagNamesToCreate) {
    // Get xref string
    const xref = await getXref(16);

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

    // Get existing tags from server
    let existingTags;
    try {
        existingTags = (await getTags(node, done, [])).tag;
    } catch (err) {
        // Log error
        node.error(`Error getting tags from Qlik Sense server: ${err}`);
        return null;
    }
    const tagExist = [];

    // Debug existing tags
    // node.log(`Existing tags: ${existingTags}`);

    // Find tags that already exist on the server
    const tagsToCreate = [];
    tagNamesToCreate.forEach((tagName) => {
        const found = existingTags.find((tag) => tag.name === tagName);

        if (!found) {
            tagsToCreate.push({ name: tagName });
        } else {
            tagExist.push(tagName);
        }
    });

    if (tagsToCreate.length === 0) {
        node.log('No tags to create');
        node.status({ fill: 'green', shape: 'dot', text: 'no tags to create' });
        return {
            tagCreated: [],
            tagExist,
        };
    }

    // Log number of tags that will be created
    node.log(`${tagsToCreate.length} tags will be created`);

    // Add content-type header
    headers['content-type'] = 'application/json';

    // Build Axios config
    // Place array of tag names to be created in body of request
    const axiosConfig = {
        url: `/qrs/tag/many?xrfkey=${xref}`,
        method: 'post',
        baseURL: `${node.senseServer.protocol}://${node.senseServer.host}:${node.senseServer.port}`,
        headers,
        timeout: 10000,
        responseType: 'json',
        httpsAgent,
        data: tagsToCreate,
    };

    let response;
    try {
        response = await axios.request(axiosConfig);
    } catch (err) {
        // Log error
        node.error(`Error creating tags on Qlik Sense server: ${err}`);
        return null;
    }

    // Ensure response status is 201
    if (response.status !== 201) {
        node.status({ fill: 'red', shape: 'ring', text: 'error creating tags' });
        node.log(`Error creating tags on Qlik Sense server: ${response.status} ${response.statusText}`);
        return null;
    }

    // Response is an array of created tag objects
    const tagCreated = response.data;

    // Return object containing created tags, status and statusText
    return {
        tagCreated,
        tagExist,
    };
}

// Function to delete tags on Qlik Sense server
// Parameters:
// - node: the node object
// - done: the done function
// - tagsToDelete: an array of tag objects to delete
async function deleteTags(node, done, tagNamesToDelete) {
    // Get xref string
    const xref = await getXref(16);

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

    // Get existing tags from server
    let existingTags;
    try {
        existingTags = (await getTags(node, done, [])).tag;
    } catch (err) {
        // Log error
        node.error(`Error getting tags from Qlik Sense server: ${err}`);
        return null;
    }
    const tagNameNoExist = [];

    // Find tags that already exist on the server
    const tagsToDelete = [];
    tagNamesToDelete.forEach((tagName) => {
        const found = existingTags.find((tag) => tag.name === tagName);

        if (found) {
            tagsToDelete.push(found);
        } else {
            tagNameNoExist.push(tagName);
        }
    });

    if (tagsToDelete.length === 0) {
        node.log('No tags to delete');
        node.status({ fill: 'green', shape: 'dot', text: 'no tags to delete' });
        return {
            tagDeleted: [],
            tagNameNoExist,
        };
    }

    // Log number of tags that will be deleted
    node.log(`${tagsToDelete.length} tags will be deleted`);

    // Add content-type header
    headers['content-type'] = 'application/json';

    // Build basic Axios config
    const axiosConfig = {
        url: '',
        method: 'delete',
        baseURL: `${node.senseServer.protocol}://${node.senseServer.host}:${node.senseServer.port}`,
        headers,
        timeout: 10000,
        responseType: 'json',
        httpsAgent,
    };

    // Array to hold deleted tags
    const tagDeleted = [];

    // Loop over array of tags and delete each one separately
    // Build URL for each tag ID
    for (let i = 0; i < tagsToDelete.length; i += 1) {
        axiosConfig.url = `/qrs/tag/${tagsToDelete[i].id}?xrfkey=${xref}`;

        // Make REST call to QRS API
        // eslint-disable-next-line no-await-in-loop
        const response = await axios.request(axiosConfig);

        // Ensure response status is 204
        if (response.status !== 204) {
            node.status({ fill: 'red', shape: 'ring', text: 'error deleting tag' });
            node.log(`Error deleting tag ${tagsToDelete[i].id} on Qlik Sense server: ${response.status} ${response.statusText}`);
            throw new Error(`Error deleting tag ${tagsToDelete[i].id} on Qlik Sense server: ${response.status} ${response.statusText}`);
        } else {
            tagDeleted.push(tagsToDelete[i]);
        }

        // Log success
        node.log(`Deleted tag ${tagsToDelete[i].id} = "${tagsToDelete[i].name}" on Qlik Sense server.`);
    }

    // Return object containing created tags, status and statusText
    return {
        tagDeleted,
        tagNameNoExist,
    };
}

// Function to get tags for a specific app
// Use Axios to make the REST call to QRS API
async function getAppTags(node, appId) {
    // Get xref string
    const xref = await getXref(16);

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
    // Place array of tag names in body of request
    const axiosConfig = {
        url: `/qrs/app/${appId}?xrfkey=${xref}`,
        method: 'get',
        baseURL: `${node.senseServer.protocol}://${node.senseServer.host}:${node.senseServer.port}`,
        headers,
        timeout: 10000,
        responseType: 'json',
        httpsAgent,
    };

    // Make REST call to QRS API
    const response = await axios.request(axiosConfig);

    // Ensure response status is 200
    if (response.status !== 200) {
        node.status({ fill: 'red', shape: 'ring', text: 'error getting tags for app' });
        node.log(`Error getting tags for app ${appId} from Qlik Sense server: ${response.status} ${response.statusText}`);
        throw new Error(`Error getting tags for app ${appId} from Qlik Sense server: ${response.status} ${response.statusText}`);
    } else {
        // Log success
        node.log(`Found ${response.data.tags.length} tags for app ${appId} on Qlik Sense server.`);
    }

    // Return object containing tags, status and statusText
    return {
        appTags: response.data.tags,
        qrsStatus: response.status,
        qrsStatusText: response.statusText,
    };
}

module.exports = {
    getTags,
    createTags,
    deleteTags,
    getAppTags,
};
