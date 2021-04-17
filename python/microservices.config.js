module.exports = {
  "apps": [
    {
      name: 'scenery_sift_microservice',
      script: 'sift_web.py',
      log_file: 'scenery_sift_microservice.txt',
      interpreter: "python3",
      time: true,
      cwd:"./python"
    },
    {
      name: 'scenery_NN_microservice',
      script: 'clip_web.py',
      log_file: 'scenery_NN_microservice.txt',
      interpreter: "python3",
      time: true,
      cwd:"./python"
    },
    {
      name: 'scenery_RGB_HIST_microservice',
      script: 'rgb_histogram_web.py',
      log_file: 'scenery_RGB_HIST_microservice.txt',
      interpreter: "python3",
      time: true,
      cwd:"./python"
    }
  ],
};