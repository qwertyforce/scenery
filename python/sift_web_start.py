import uvicorn
uvicorn.run('sift_web:app', host='127.0.0.1', port=33333, log_level="info")