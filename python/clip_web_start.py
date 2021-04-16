import uvicorn
uvicorn.run('clip_web:app', host='127.0.0.1', port=33334, log_level="info")