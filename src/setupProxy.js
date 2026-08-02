// CRA dev-server-only proxy: forwards /apim-proxy/* to APIM server-side to
// avoid browser CORS during local development. Not used in production
// builds (production calls APIM directly — see SetupProfileManagement.js).
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  app.use(
    '/apim-proxy',
    createProxyMiddleware({
      target: 'https://cnh-we-mkt-vms-apim-01.azure-api.net',
      changeOrigin: true,
      // Relaxed for local dev only: corporate network TLS inspection injects
      // a self-signed root CA that Node's trust store doesn't recognize.
      secure: false,
      // req.originalUrl retains the full path (req.url has '/apim-proxy'
      // already stripped by Express's mount routing).
      pathRewrite: (path, req) => req.originalUrl.replace(/^\/apim-proxy/, ''),
      on: {
        error: (err, req, res) => {
          console.error('[apim-proxy] error forwarding request:', err.code || err.message);
          if (res && !res.headersSent) {
            res.writeHead(502, { 'Content-Type': 'application/json' });
          }
          res.end(JSON.stringify({ message: 'Proxy error, see dev server console for details' }));
        },
      },
    })
  );
};
