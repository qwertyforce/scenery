import uvicorn
uvicorn.run('rgb_histogram_web:app', host='127.0.0.1', port=33335, log_level="info")