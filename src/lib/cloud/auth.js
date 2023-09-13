const { Auth, AuthType } = require('@qlik/sdk');
const Qlik = require('@qlik/sdk').default;

/**
 * Function to get host url for Qlik Sense Cloud
 * @param {*} tenant
 * @returns {string}    host url
 */

function getHostUrl(tenant) {
    const host = `${tenant.tenant}.${tenant.region}.qlikcloud.com`;
    return host;
}

/**
 * Function to authenticate with Qlik Sense Cloud
 * @param {*} node
 * @param {*} done
 * @returns {object}    auth and qlik objects, or false if authentication fails
 */
async function authenticate(node, done) {
    // Get host url
    const host = getHostUrl(node.tenant);

    // Which authentication type to use?
    let auth;
    let qlik;

    if (node.tenant.authType === 'oauth2-m2m') {
        // Make sure that the client ID and client secret are specified
        if (node.tenant.clientId === '') {
            node.status({ fill: 'red', shape: 'ring', text: 'client ID not specified' });
            node.log('Client ID not specified');
            if (done) {
                done('Client ID not specified');
            }
            return false;
        }

        if (node.tenant.clientSecret === '') {
            node.status({ fill: 'red', shape: 'ring', text: 'client secret not specified' });
            node.log('Client secret not specified');
            if (done) {
                done('Client secret not specified');
            }
            return false;
        }

        // Authenticate with OAuth2 m2m
        auth = new Auth({
            authType: AuthType.OAuth2,
            host,
            clientId: node.tenant.clientId,
            clientSecret: node.tenant.clientSecret,
        });

        qlik = new Qlik({
            authType: AuthType.OAuth2,
            host,
            clientId: node.tenant.clientId,
            clientSecret: node.tenant.clientSecret,
        });

        await auth.authorize();
    } else if (node.tenant.authType === 'apikey') {
        // Make sure that the API key is specified
        if (node.tenant.apiKey === '') {
            node.status({ fill: 'red', shape: 'ring', text: 'API key not specified' });
            node.log('API key not specified');
            if (done) {
                done('API key not specified');
            }
            return false;
        }

        // Authenticate with API key
        auth = new Auth({
            authType: AuthType.APIKey,
            host,
            apiKey: node.tenant.apiKey,
        });

        qlik = new Qlik({
            authType: AuthType.APIKey,
            host,
            apiKey: node.tenant.apiKey,
        });
    } else {
        // Invalid auth type. Log error and return
        node.status({ fill: 'red', shape: 'ring', text: 'invalid auth type' });
        node.log(`Invalid auth type: ${node.tenant.authType}`);
        if (done) {
            done(`Invalid auth type: ${node.tenant.authType}`);
        }
        return false;
    }

    return { auth, qlik };
}

module.exports = {
    authenticate,
    getHostUrl,
};
