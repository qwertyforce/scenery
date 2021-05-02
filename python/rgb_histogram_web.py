import uvicorn
if __name__ == '__main__':
    uvicorn.run('rgb_histogram_web:app', host='127.0.0.1', port=33335, log_level="info")
    
from pydantic import BaseModel
from fastapi import FastAPI, File,Body,Form, HTTPException
from os import listdir
import numpy as np
from PIL import Image
from tqdm import tqdm
import cv2
import sqlite3
import io
conn = sqlite3.connect('rgb_histograms.db')

import nmslib
# dim=4096
IMAGE_PATH="./../public/images"
index = nmslib.init(method='hnsw', space="l1", data_type=nmslib.DataType.DENSE_VECTOR) 
index_time_params = {'M': 32,'efConstruction': 200}

def init_index():
    all_ids=get_all_ids()
    for id in tqdm(all_ids):
        image_features = convert_array(get_rgb_histogram_by_id(id))
        # print(image_features)
        index.addDataPoint(id,image_features)
    index.createIndex(index_time_params) 
    print("Index is ready")
       
def read_img_file(image_data):
    img = Image.open(io.BytesIO(image_data))
    return img

def get_rgb_histogram_by_id(id):
    cursor = conn.cursor()
    query = '''
    SELECT rgb_histogram
    FROM rgb_hists
    WHERE id = (?)
    '''
    cursor.execute(query,(id,))
    all_rows = cursor.fetchone()
    return all_rows[0]    

def get_features(image_buffer):
    query_image=np.array(read_img_file(image_buffer).convert('RGB'))
    query_hist_combined=cv2.calcHist([query_image],[0,1,2],None,[16,16,16],[0,256,0,256,0,256])
    query_hist_combined = query_hist_combined.flatten()
    query_hist_combined=np.divide(query_hist_combined,query_image.shape[0]*query_image.shape[1],dtype=np.float32)
    return query_hist_combined

def create_table():
	cursor = conn.cursor()
	query = '''
	    CREATE TABLE IF NOT EXISTS rgb_hists(
	    	id INTEGER NOT NULL UNIQUE PRIMARY KEY, 
	    	rgb_histogram BLOB NOT NULL
	    )
	'''
	cursor.execute(query)
	conn.commit()

def check_if_exists_by_id(id):
    cursor = conn.cursor()
    query = '''SELECT EXISTS(SELECT 1 FROM rgb_hists WHERE id=(?))'''
    cursor.execute(query,(id,))
    all_rows = cursor.fetchone()
    return all_rows[0] == 1    

def delete_descriptor_by_id(id):
	cursor = conn.cursor()
	query = '''DELETE FROM rgb_hists WHERE id=(?)'''
	cursor.execute(query,(id,))
	conn.commit()

def get_all_ids():
    cursor = conn.cursor()
    query = '''SELECT id FROM rgb_hists'''
    cursor.execute(query)
    all_rows = cursor.fetchall()
    return list(map(lambda el:el[0],all_rows))

def convert_array(text):
    out = io.BytesIO(text)
    out.seek(0)
    return np.load(out)

def adapt_array(arr):
    out = io.BytesIO()
    np.save(out, arr)
    out.seek(0)
    return sqlite3.Binary(out.read())

def add_descriptor(id,rgb_histogram):
	cursor = conn.cursor()
	query = '''INSERT INTO rgb_hists(id, rgb_histogram) VALUES (?,?)'''
	cursor.execute(query,(id,rgb_histogram))
	conn.commit()

def sync_db():
    ids_in_db=set(get_all_ids())
    file_names=listdir(IMAGE_PATH)
    for file_name in file_names:
        file_id=int(file_name[:file_name.index('.')])
        if file_id in ids_in_db:
            ids_in_db.remove(file_id)
    for id in ids_in_db:
        delete_descriptor_by_id(id)   #Fix this
        print(f"deleting {id}")
    print("db synced")
    
app = FastAPI()
@app.get("/")
async def read_root():
    return {"Hello": "World"}

@app.post("/calculate_HIST_features")
async def calculate_HIST_features_handler(image: bytes = File(...),image_id: str = Form(...)):
    features=get_features(image)
    add_descriptor(int(image_id),adapt_array(features))
    index.addDataPoint(int(image_id),features)
    index.createIndex(index_time_params) 
    return {"status":"200"}

class Item_image_id(BaseModel):
    image_id: int

from timeit import default_timer as timer
@app.post("/get_similar_images_by_id")
async def get_similar_images_by_id_handler(item: Item_image_id):
    try:
       start = timer()
       target_features = convert_array(get_rgb_histogram_by_id(item.image_id))
       labels, _ = index.knnQuery(target_features, k=20)
       end = timer()
       print((end - start)*1000)
       return labels.tolist()
    except RuntimeError:
       raise HTTPException(
           status_code=500, detail="Image with this id is not found")
           
@app.post("/delete_HIST_features")
async def delete_hist_features_handler(item:Item_image_id):
    delete_descriptor_by_id(item.image_id)
    init_index()
    return {"status":"200"}

print(__name__)

if __name__ == 'rgb_histogram_web':
    create_table()
    sync_db()
    init_index()



   
