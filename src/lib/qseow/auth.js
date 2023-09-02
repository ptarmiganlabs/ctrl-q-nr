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

    // eslint-disable-next-line consistent-return
    return {
        axiosConfig,
        xref,
    };
}

module.exports = {
    getAuth,
};
