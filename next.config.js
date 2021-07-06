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
    distDir: '_next'
}