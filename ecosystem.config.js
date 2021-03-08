module.exports = {
  "apps": [
    {
      name: 'scenery_python_microservice',
      script: './python/sift_web.py',
      log_file: 'scenery_python_microservice.txt',
      interpreter: "python3",
      time: true
    },
    {
      name: 'scenery',
      script: './dist/server/index.js',
      env: { "NODE_ENV": "production" },
      log_file: 'log.txt',
      time: true
    },

  ],
};