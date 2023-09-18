const { authenticate } = require('../lib/cloud/auth');

// eslint-disable-next-line func-names
module.exports = function (RED) {
    function QlikSenseCloudLicense(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        // Get data from node configuration
        node.tenant = RED.nodes.getNode(config.tenant);

        node.on('input', async (msg, send, done) => {
            node.log('Getting license info from Qlik Sense cloud...');

            const outMsg1 = {
                payload: {
                    license: {},
                },
            };

            try {
                // Get auth object
                const { auth } = await authenticate(node, done);
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
                outMsg1.payload.license.overview = licenseOverview;
                outMsg1.payload.license.status = licenseStatus;
                outMsg1.payload.license.settings = licenseSettings;
                outMsg1.payload.license.consumption = licenseConsumption;
                outMsg1.payload.license.assignments = licenseAssignments;

                // Add parts and reset properties if they are present
                if (msg.parts) {
                    outMsg1.parts = msg.parts;
                }
                // eslint-disable-next-line no-underscore-dangle
                if (msg._msgid) {
                    // eslint-disable-next-line no-underscore-dangle
                    outMsg1._msgid = msg._msgid;
                }
                if (msg.reset) {
                    outMsg1.reset = msg.reset;
                }

                send(outMsg1);

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
