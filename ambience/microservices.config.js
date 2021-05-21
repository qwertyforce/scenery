module.exports = {
  "apps": [
    {
      name: 'ambience_microservice',
      script: 'index.js',
      log_file: 'ambience_microservice.txt',
      time: true,
      cwd: "./ambience/dist/server"
    },
    {
      name: 'akaze_microservice',
      script: 'akaze_web.py',
      log_file: 'akaze_microservice.txt',
      interpreter: "python3",
      time: true,
      cwd: "./ambience/modules/akaze"
    },
    {
      name: 'nn_microservice',
      script: 'clip_web.py',
      log_file: 'nn_microservice.txt',
      interpreter: "python3",
      time: true,
      cwd: "./ambience/modules/nn"
    },
    {
      name: 'phash_microservice',
      script: 'phash_web.py',
      log_file: 'phash_microservice.txt',
      interpreter: "python3",
      time: true,
      cwd: "./ambience/modules/phash"
    },
    {
      name: 'hist_microservice',
      script: 'rgb_histogram_web.py',
      log_file: 'histogram_microservice.txt',
      interpreter: "python3",
      time: true,
      cwd: "./ambience/modules/histogram"
    }
  ],
};