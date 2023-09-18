const axios = require('axios');

const { getAuth } = require('./auth');

// Function to start tasks on Qlik Sense server
// Parameters:
// - node: the node object
// - done: the done function
async function getServiceStatus(node, done) {
    // Set up authentication
    const { axiosConfig, xref } = getAuth(node);

    // **********************************
    // *** Get enums from QRS ***
    node.log('Getting enums from Qlik Sense server...');

    axiosConfig.url = `/qrs/about/api/enums?xrfkey=${xref}`;
    let responseEnum;
    try {
        responseEnum = await axios.request(axiosConfig);
    } catch (err) {
        // Log error
        node.error(`Error when getting enums: ${err}`);
        return null;
    }

    // Get enums for ServiceStatus.ServiceType
    // Specifically, get all entries where the "usages" property contains values that equal "ServiceStatus.ServiceType"
    // The data retrieved from QRS is an object
    const enumServiceType = {};
    Object.keys(responseEnum.data).forEach((key) => {
        const enumItem = responseEnum.data[key];
        enumItem.usages.forEach((usage) => {
            if (usage === 'ServiceStatus.ServiceType') {
                // Debug
                node.log(`enumItem: ${JSON.stringify(enumItem)}`);

                // The enumItem.values property is an array of strings.
                // Example: ['0: Repository', '1: Proxy', '2: Scheduler', '3: Engine', '4: AppMigration', '5: Printing']
                // Break the strings into key/value pairs and add them to the enums dictionary.
                // Use the first character as the key and the rest as the value.
                // Remove the ": " from the string.
                enumItem.values.forEach((value) => {
                    const key2 = value.substr(0, 1);
                    const value2 = value.substr(3);
                    enumServiceType[key2] = value2;
                });
            }
        });
    });

    // Log enums
    node.log(`enumServiceType: ${JSON.stringify(enumServiceType)}`);

    // Get enums for ServiceStatus.ServiceState
    // Specifically, get all entries where the "usages" property contains values that equal "ServiceStatus.ServiceState"
    // The data retrieved from QRS is an object
    const enumServiceState = {};
    Object.keys(responseEnum.data).forEach((key) => {
        const enumItem = responseEnum.data[key];
        enumItem.usages.forEach((usage) => {
            if (usage === 'ServiceStatus.ServiceState') {
                // Debug
                node.log(`enumItem: ${JSON.stringify(enumItem)}`);

                enumItem.values.forEach((value) => {
                    const key2 = value.substr(0, 1);
                    const value2 = value.substr(3);
                    enumServiceState[key2] = value2;
                });
            }
        });
    });

    // Log enums
    node.log(`enumServiceState: ${JSON.stringify(enumServiceState)}`);

    // Get service status
    axiosConfig.url = `/qrs/servicestatus/full?xrfkey=${xref}`;

    let response;
    try {
        response = await axios(axiosConfig);

        // Ensure response status is 204
        if (response.status !== 200) {
            node.status({ fill: 'red', shape: 'ring', text: 'error getting service status' });
            node.log(`Error getting service status from Qlik Sense server: ${response.status} ${response.statusText}`);
            done(`Error getting service status from Qlik Sense server: ${response.status} ${response.statusText}`);
            return null;
        }
    } catch (err) {
        // Log error
        node.error(`Error when getting service status: ${err}`);
        return null;
    }

    const serviceStatus = response.data;

    // Use enums to get human-readable values for ServiceType and ServiceState
    const updatedServiceStatus = serviceStatus.map((service) => ({
        ...service,
        serviceTypeText: enumServiceType[service.serviceType],
        serviceStateText: enumServiceState[service.serviceState],
    }));

    // Return different task types separately
    return updatedServiceStatus;
}

module.exports = {
    getServiceStatus,
};
