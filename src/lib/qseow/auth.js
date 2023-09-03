const fs = require('fs');
const https = require('https');

const { getXref } = require('../misc/xref');
const { getHeaders } = require('./header');

// Get auth object for client-managed Qlik Sense Enterprise on Windows
function getAuth(node) {
    // Get xref string
    const xref = getXref(16);

    // Get headers
    const headers = getHeaders(xref);

    // Create httpsAgent
    const { authType } = node.senseServer;
    let httpsAgent;

    if (authType === 'cert') {
        // Ensure that the cert and key files exist
        if (!fs.existsSync(node.senseServer.certFile)) {
            node.error(`Cert file does not exist: ${node.senseServer.certFile}`);
            throw new Error(`Cert file does not exist: ${node.senseServer.certFile}`);
        }

        if (!fs.existsSync(node.senseServer.keyFile)) {
            node.error(`Key file does not exist: ${node.senseServer.keyFile}`);
            throw new Error(`Key file does not exist: ${node.senseServer.keyFile}`);
        }

        // If the cert CA file is specified, ensure that it exists
        if (node.senseServer.certCaFile !== '') {
            if (!fs.existsSync(node.senseServer.certCaFile)) {
                node.error(`Cert CA file does not exist: ${node.senseServer.certCaFile}`);
                throw new Error(`Cert CA file does not exist: ${node.senseServer.certCaFile}`);
            }
            process.env.NODE_EXTRA_CA_CERTS = 'node.senseServer.certCaFile';
        }

        const cert = fs.readFileSync(node.senseServer.certFile);
        const key = fs.readFileSync(node.senseServer.keyFile);

        httpsAgent = new https.Agent({
            cert,
            key,
            rejectUnauthorized: false,
        });

        // Only use the cert CA file if it is specified
        // if (node.senseServer.certCaFile !== '') {
        //     node.log('Using root CA file');
        //     // Debug which files are being used
        //     node.log(`Using cert file: "${node.senseServer.certFile}"`);
        //     node.log(`Using key file: "${node.senseServer.keyFile}"`);
        //     node.log(`Using cert CA file: "${node.senseServer.certCaFile}"`);

        //     const ca = fs.readFileSync(node.senseServer.certCaFile);

        //     httpsAgent = new https.Agent({
        //         cert,
        //         key,
        //         ca,
        //         rejectUnauthorized: false,
        //     });
        // } else {
        //     node.log('Not using root CA file');
        //     node.log(`Using cert file: "${node.senseServer.certFile}"`);
        //     node.log(`Using key file: "${node.senseServer.keyFile}"`);
        //     node.log(`Using cert CA file: "${node.senseServer.certCaFile}"`);

        //     httpsAgent = new https.Agent({
        //         cert,
        //         key,
        //         rejectUnauthorized: false,
        //     });
        // };
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

    // eslint-disable-next-line consistent-return
    return {
        axiosConfig,
        xref,
    };
}

module.exports = {
    getAuth,
};
