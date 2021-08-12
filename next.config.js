require('sharp'); //https://github.com/lovell/sharp/issues/2655#issuecomment-815684743
module.exports = {
  poweredByHeader: false,
  // typescript: {ignoreBuildErrors: true},
  optimizeFonts: false,
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/last_added/1'
      }
    ]
  },
  env: {
    recaptcha_site_key: "6LcqV9QUAAAAAEybBVr0FWnUnFQmOVxGoQ_Muhtb",
    api_domain: "http://localhost/public_api",
    reverse_search_url: "http://localhost",
    domain: "http://localhost"
  },
  distDir: '_next'
}