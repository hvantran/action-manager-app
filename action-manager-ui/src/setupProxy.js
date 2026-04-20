const { createProxyMiddleware } = require('http-proxy-middleware');

const gatewayTarget = process.env.REACT_APP_GATEWAY_PROXY_TARGET || 'http://localhost:6081';

module.exports = function setupProxy(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: gatewayTarget,
      changeOrigin: true,
      secure: false,
    })
  );
};
