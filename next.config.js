/* eslint-disable @typescript-eslint/no-var-requires */
require('sharp') //https://github.com/lovell/sharp/issues/2655#issuecomment-815684743
const zlib = require("zlib")
const CompressionPlugin = require("compression-webpack-plugin")
const use_brotli = false
module.exports = {
  poweredByHeader: false,
  compress: false,
  // typescript: {ignoreBuildErrors: true},
  optimizeFonts: false, //fix flickering font
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/last_added/1'
      }
    ]
  },
  webpack: (config, { isServer }) => {
    if (use_brotli && !isServer) {
      config.plugins.push(
        new CompressionPlugin({
          filename: "[path][base].br",
          algorithm: "brotliCompress",
          test: /\.(js|css|html)$/,
          compressionOptions: {
            params: {
              [zlib.constants.BROTLI_PARAM_QUALITY]: 1,
            },
          }
        })
      )
    }
    return config
  },
  webpack5: false,
  env: {  //https://nextjs.org/docs/api-reference/next.config.js/environment-variables
    recaptcha_site_key: "6LcqV9QUAAAAAEybBVr0FWnUnFQmOVxGoQ_Muhtb",
    api_domain: "http://localhost/public_api",
    reverse_search_url: "http://localhost",
    domain: "http://localhost",
    ipns: "ipns.scenery.cx"
  },
  distDir: '_next'
}