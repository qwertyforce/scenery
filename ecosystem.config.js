module.exports = {
  "apps": [
    {
      name: 'scenery_sift_microservice',
      script: './python/sift_web.py',
      log_file: 'scenery_sift_microservice.txt',
      interpreter: "python3",
      time: true
    },
    {
      name: 'scenery_NN_microservice',
      script: './python/clip_web.py',
      log_file: 'scenery_NN_microservice.txt',
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