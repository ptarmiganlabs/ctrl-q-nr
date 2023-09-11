const { authenticate } = require('../lib/cloud/auth');
// import { Auth, AuthType, Apps } from '@qlik/sdk';

// eslint-disable-next-line func-names
module.exports = function (RED) {
    function QlikSenseCloudLicense(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        // Get data from node configuration
        node.tenant = RED.nodes.getNode(config.tenant);

        node.on('input', async (msg, send, done) => {
            node.log('Getting license info from Qlik Sense cloud...');

            const outMsg = {
                payload: {
                    license: {},
                },
            };

            try {
                // Get auth object
                const auth = await authenticate(node, done);
                if (!auth) {
                    // Error when authenticating
                    node.status({ fill: 'red', shape: 'ring', text: 'error authenticating' });
                    done('Error authenticating');
                    return false;
                }

                // Get endpoint /licenses/overview
                let response = await auth.rest('/licenses/overview');
                const licenseOverview = await response.json();

                // Get endpoint /licenses/status
                response = await auth.rest('/licenses/status');
                const licenseStatus = await response.json();

                // Get endpoint /licenses/settings
                response = await auth.rest('/licenses/settings');
                const licenseSettings = await response.json();

                // Endpoint licenses/consumption
                response = await auth.rest('/licenses/consumption');
                const licenseConsumption = await response.json();

                // Endpoint licenses/assignments
                response = await auth.rest('/licenses/assignments');
                const licenseAssignments = await response.json();

                // Assemble output message
                outMsg.payload.license.overview = licenseOverview;
                outMsg.payload.license.status = licenseStatus;
                outMsg.payload.license.settings = licenseSettings;
                outMsg.payload.license.consumption = licenseConsumption;
                outMsg.payload.license.assignments = licenseAssignments;

                send(outMsg);

                done();
            } catch (err) {
                node.error(err);
                done(err);
            }

            return true;
        });
    }

    RED.nodes.registerType('qscloud-license', QlikSenseCloudLicense, {
        defaults: {
            tenant: { value: '', type: 'qscloud-tenant', required: true },
        },
    });
};
