// eslint-disable-next-line func-names
module.exports = function (RED) {
    function QlikSenseCloudTenant(config) {
        RED.nodes.createNode(this, config);

        const node = this;
        node.tenant = config.tenant;
        node.region = config.region;
        node.authType = config.authType;
        node.clientId = config.clientId;
        node.clientSecret = config.clientSecret;
        node.apiKey = config.apiKey;

        if (node.authType === 'oauth2-m2m') {
            node.clientId = config.clientId;
            node.clientSecret = config.clientSecret;
        } else if (node.authType === 'apikey') {
            node.apiKey = config.apiKey;
        }
    }
    RED.nodes.registerType('qscloud-tenant', QlikSenseCloudTenant, {});
};
