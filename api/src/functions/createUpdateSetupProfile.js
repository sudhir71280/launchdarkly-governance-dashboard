// Server-side proxy for the Setup Profiles API. Runs as an Azure Static Web
// Apps managed Function, so the browser calls this same-origin endpoint
// instead of APIM directly — no CORS policy on APIM is required, and the
// APIM subscription key never ships in the client-side bundle (it's read
// from this Function's app settings, configured in the Azure Portal).
const { app } = require('@azure/functions');

const APIM_BASE_URL = 'https://cnh-we-mkt-vms-apim-01.azure-api.net';
const APIM_PATH = '/bff/dev/b2c/v1.0/Configurations/CreateUpdateSetupProfile';

app.http('createUpdateSetupProfile', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'CreateUpdateSetupProfile',
  handler: async (request, context) => {
    const subscriptionKey = process.env.APIM_SUBSCRIPTION_KEY;
    if (!subscriptionKey) {
      context.error('APIM_SUBSCRIPTION_KEY app setting is not configured.');
      return { status: 500, jsonBody: { message: 'Server is not configured to reach APIM.' } };
    }

    let payload;
    try {
      payload = await request.json();
    } catch (err) {
      return { status: 400, jsonBody: { message: 'Invalid JSON payload.' } };
    }

    try {
      const apimResponse = await fetch(`${APIM_BASE_URL}${APIM_PATH}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json-patch+json',
          'Ocp-Apim-Subscription-Key': subscriptionKey,
        },
        body: JSON.stringify(payload),
      });

      const text = await apimResponse.text();
      return {
        status: apimResponse.status,
        headers: { 'Content-Type': 'application/json' },
        body: text,
      };
    } catch (err) {
      context.error('Error forwarding request to APIM:', err);
      return { status: 502, jsonBody: { message: 'Failed to reach APIM.' } };
    }
  },
});
