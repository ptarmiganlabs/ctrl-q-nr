// eslint-disable-next-line func-names
module.exports = function (RED) {
    function QlikSenseServerNode(config) {
        RED.nodes.createNode(this, config);

        const node = this;
        node.qrsHost = config.qrsHost;
        node.qrsPort = config.qrsPort;
        node.qrsProtocol = config.qrsProtocol;
        node.engineHost = config.engineHost;
        node.enginePort = config.enginePort;
        node.engineProtocol = config.engineProtocol;

        node.authType = config.authType;
        if (node.authType === 'cert') {
            node.certFile = config.certFile;
            node.keyFile = config.keyFile;
            node.certCaFile = config.certCaFile;
        } else if (node.authType === 'jwt') {
            node.jwt = config.jwt || '';
        }
    }
    RED.nodes.registerType('qseow-sense-server', QlikSenseServerNode, {});
};
