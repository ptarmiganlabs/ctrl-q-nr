const { Auth, AuthType } = require('@qlik/sdk');

// Function to get host url for Qlik Sense Cloud
function getHostUrl(tenant) {
    const host = `${tenant.tenant}.${tenant.region}.qlikcloud.com`;
    return host;
}

// Function to authenticate with Qlik Sense Cloud
// Return an auth object
async function authenticate(node, done) {
    // Get host url
    const host = getHostUrl(node.tenant);

    // Which authentication type to use?
    let auth;
    if (node.tenant.authType === 'oauth2-m2m') {
        // Authenticate with OAuth2 m2m
        auth = new Auth({
            authType: AuthType.OAuth2,
            host,
            clientId: node.tenant.clientId,
            clientSecret: node.tenant.clientSecret,
        });

        await auth.authorize();
    } else if (node.tenant.authType === 'apikey') {
        // Authenticate with API key
        auth = new Auth({
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
        return;
    }

    // eslint-disable-next-line consistent-return
    return auth;
}

module.exports = {
    authenticate,
    getHostUrl,
};
