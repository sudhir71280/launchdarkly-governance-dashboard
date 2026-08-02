// Local-dev-only mock of the Azure Static Web Apps identity endpoint
// (GET /.auth/me). In production, Azure Static Web Apps reserves the
// /.auth/* path prefix for its own platform routes — requests never reach
// this Function there, so the real signed-in user's identity is always
// used in production. This mock exists purely so `npm run start:api` +
// `npm start` locally can also show a Created By / Owner value without
// needing the (currently blocked) Static Web Apps CLI.
const { app } = require('@azure/functions');

app.http('authMe', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: '.auth/me',
  handler: async () => ({
    jsonBody: {
      clientPrincipal: {
        identityProvider: 'aad',
        userId: 'local-dev-user',
        userDetails: 'local-dev-user@cnh1.cnhgroup.cnh.com',
        userRoles: ['anonymous', 'authenticated'],
      },
    },
  }),
});
