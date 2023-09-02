// eslint-disable-next-line func-names
module.exports = function (RED) {
    function QlikSenseServerNode(config) {
        RED.nodes.createNode(this, config);

        const node = this;
        node.host = config.host;
        node.port = config.port;
        node.protocol = config.protocol;
        node.authType = config.authType;
        if (node.authType === 'cert') {
            node.certFile = config.certFile;
            node.keyFile = config.keyFile;
        } else if (node.authType === 'jwt') {
            node.jwt = config.jwt || '';
        }
    }
    RED.nodes.registerType('qlik-sense-server', QlikSenseServerNode, {});
};
