const axios = require('axios');

const { getAuth } = require('./auth');

// Functon to get license from Qlik Sense server
// Parameters:
// - node: the node object
// - done: the done function
async function getLicense(node, done) {
    const { axiosConfig, xref } = getAuth(node);

    // Set up Axios for GET request
    axiosConfig.url = `/qrs/license?xrfkey=${xref}`;

    try {
        // Get license from QRS API
        const response = await axios.request(axiosConfig);

        // Ensure response status is 200
        if (response.status !== 200) {
            node.status({ fill: 'red', shape: 'ring', text: 'error getting license' });
            node.log(`Error getting license from Qlik Sense server: ${response.status} ${response.statusText}`);
            return null;
        }

        // Return object containing license
        return {
            license: response.data,
        };
    } catch (err) {
        // Log error
        node.error(`Error when getting license: ${err}`);
        return null;
    }
}

module.exports = {
    getLicense,
};
