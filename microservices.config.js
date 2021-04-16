module.exports = {
  "apps": [
    {
      name: 'scenery_sift_microservice',
      script: './python/sift_web_start.py',
      log_file: 'scenery_sift_microservice.txt',
      interpreter: "python3",
      time: true
    },
    {
      name: 'scenery_NN_microservice',
      script: './python/clip_web_start.py',
      log_file: 'scenery_NN_microservice.txt',
      interpreter: "python3",
      time: true
    },
    {
      name: 'scenery_RGB_HIST_microservice',
      script: './python/clip_web_start.py',
      log_file: 'scenery_NN_microservice.txt',
      interpreter: "python3",
      time: true
    }
  ],
};