const { Auth, AuthType } = require('@qlik/sdk');
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
                    status: {},
                },
            };

            try {
                // Build host url
                const host = `${node.tenant.tenant}.${node.tenant.region}.qlikcloud.com`;
                node.log(`Host: ${host}`);

                const auth = new Auth({
                    authType: AuthType.OAuth2,
                    host,
                    clientId: node.tenant.clientId,
                    clientSecret: node.tenant.clientSecret,
                });

                await auth.authorize();

                // let resp = await auth.rest('/users/me').then((output) => output.json());
                // console.log(resp);

                // // get a list of applications
                // resp = await auth.rest('/apps').then((output) => output.json());

                // // iterate through the resulting array and retrieve the app id and name
                // resp.data.forEach((item) => {
                //     // console output to show the app information from the rest endpoint
                //     console.log(`${item.attributes.id} - ${item.attributes.name}`);
                // });
                // const apps = new Apps(auth);

                // // get the reference to the first app returned in the list
                // let app = await apps.get(resp.data[0].attributes.id);

                // // open the app
                // await app.open();

                // // get the app layout
                // let appLayout = await app.getAppLayout();
                // // console output from the Qlik Analytics Engine containing app metadata
                // console.log(appLayout);

                // const licenses = new Licenses(auth);

                // let response = await auth.rest('/licenses/status').then((output) => output.json());
                // let response = await auth.rest('/licenses/status').then((output) => {
                //     const a = await output.json();
                //     console.log(a);

                //     return {
                //         data: output.json(),
                //         status: output.status,

                //     }
                // } );

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
                outMsg.payload.overview = licenseOverview;
                outMsg.payload.status = licenseStatus;
                outMsg.payload.settings = licenseSettings;
                outMsg.payload.consumption = licenseConsumption;
                outMsg.payload.assignments = licenseAssignments;

                send(outMsg);

                done();

                // Build path to license info
                // const path = '/licenses/status';
                // node.log(`Path: ${path}`);

                //  response = await auth.rest(path);
                // node.log(JSON.stringify(response));
            } catch (err) {
                node.error(err);
                done(err);
            }
        });
    }

    RED.nodes.registerType('qscloud-license', QlikSenseCloudLicense, {
        defaults: {
            tenant: { value: '', type: 'qscloud-tenant', required: true },
        },
    });
};
