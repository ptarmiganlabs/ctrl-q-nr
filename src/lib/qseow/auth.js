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

    // Variable to keep our own root CA cert in
    // let additionalCerts;
    let combinedCert;

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

            // Debug: Does https.globalAgent.options exist?
            if (https.globalAgent.options) {
                node.log('https.globalAgent.options exists');

                // Debug: Does https.globalAgent.options.ca exist?
                if (https.globalAgent.options.ca) {
                    node.log('https.globalAgent.options.ca exists');
                } else {
                    node.log('https.globalAgent.options.ca does not exist');
                }
            } else {
                node.log('https.globalAgent.options does not exist');
            }

            // const list = (node.senseServer.certCaFile || '').split(',');
            // additionalCerts = list.map((extraCert) => fs.readFileSync(extraCert, 'utf8'));

            // console.log('https.globalAgent: ' + https.globalAgent);
            // console.log('https.globalAgent: ' + JSON.stringify(https.globalAgent, null, 2));

            // additionalCerts = fs.readFileSync(node.senseServer.certCaFile, 'utf8');
            // https.globalAgent.options.ca = [...tls.rootCertificates, ...additionalCerts];

            // rootCas.addFile(path.resolve(__dirname, 'intermediate.pem'));
            // process.env.NODE_EXTRA_CA_CERTS = 'node.senseServer.certCaFile';

            // const list = (process.env.NODE_EXTRA_CA_CERTS || '').split(',');
            // additionalCerts = list.map((extraCert) => fs.readFileSync(extraCert, 'utf8'));

            // if (!https.globalAgent.options) https.globalAgent.options = {};
            // https.globalAgent.options.ca = [...tls.rootCertificates, ...additionalCerts];
        }

        const clientCert = fs.readFileSync(node.senseServer.certFile);
        const clientKey = fs.readFileSync(node.senseServer.keyFile);
        let rootCert;

        if (node.senseServer.certCaFile !== '') {
            node.log('Combining client cert and root cert');
            rootCert = fs.readFileSync(node.senseServer.certCaFile);
            combinedCert = Buffer.concat([clientCert, rootCert]);
            node.log(`Combined cert: " ${combinedCert}`);
        }

        // Only use the cert CA file if it is specified
        if (node.senseServer.certCaFile !== '') {
            node.log('Using root CA file');
            // Debug which files are being used
            node.log(`Using cert file: "${node.senseServer.certFile}"`);
            node.log(`Using key file: "${node.senseServer.keyFile}"`);
            node.log(`Using cert CA file: "${node.senseServer.certCaFile}"`);

            httpsAgent = new https.Agent({
                cert: clientCert,
                key: clientKey,
                ca: rootCert,
                rejectUnauthorized: true,
            });
        } else {
            node.log('Not using root CA file');
            node.log(`Using cert file: "${node.senseServer.certFile}"`);
            node.log(`Using key file: "${node.senseServer.keyFile}"`);

            if (https.globalAgent.options) {
                node.log('https.globalAgent.options exists');
                node.log(`https.globalAgent.options: ${JSON.stringify(https.globalAgent.options)}`);
                if (https.globalAgent.options.ca) {
                    node.log('https.globalAgent.options.ca exists');
                    node.log(`https.globalAgent.options.ca: ${JSON.stringify(https.globalAgent.options.ca)}`);
                } else {
                    node.log('https.globalAgent.options.ca does not exist');
                }
            } else {
                node.log('https.globalAgent.options does not exist');
            }

            httpsAgent = new https.Agent({
                cert: clientCert,
                key: clientKey,
                rejectUnauthorized: false,
            });
        }
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
