module.exports = {
    poweredByHeader: false,
    async rewrites() {
        return [
          {
            source: '/',
            destination: '/last_added/1'
          },
        ]
      }
}