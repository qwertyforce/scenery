import cv2
from PIL import Image
from os import listdir
import numpy as np
import math
from fastapi import FastAPI, File, UploadFile,Body,Form
from pydantic import BaseModel

import sqlite3
import io
conn = sqlite3.connect('sift.db')
# conn = sqlite3.connect('./python/sift.db')

sift = cv2.SIFT_create(nfeatures=500)
bf = cv2.BFMatcher()

def create_table():
	cursor = conn.cursor()
	query = '''
	    CREATE TABLE IF NOT EXISTS sift(
	    	id INTEGER NOT NULL UNIQUE PRIMARY KEY, 
	    	sift_features BLOB NOT NULL
	    )
	'''
	cursor.execute(query)
	conn.commit()

def sync_db():
    IMAGE_PATH="./../public/images"
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

def add_descriptor(id,sift_features):
	cursor = conn.cursor()
	query = '''INSERT INTO sift(id, sift_features )VALUES (?,?)'''
	cursor.execute(query,(id,sift_features))
	conn.commit()

def delete_descriptor_by_id(id):
	cursor = conn.cursor()
	query = '''DELETE FROM sift WHERE id=(?)'''
	cursor.execute(query,(id,))
	conn.commit()

def get_all_ids():
    cursor = conn.cursor()
    query = '''SELECT id FROM sift'''
    cursor.execute(query)
    all_rows = cursor.fetchall()
    return list(map(lambda el:el[0],all_rows))  

def adapt_array(arr):
    out = io.BytesIO()
    np.save(out, arr)
    out.seek(0)
    return sqlite3.Binary(out.read())

def convert_array(text):
    out = io.BytesIO(text)
    out.seek(0)
    return np.load(out)

def get_sift_features_by_id(id):
    cursor = conn.cursor()
    query = '''
    SELECT sift_features
    FROM sift
    WHERE id = (?)
    '''
    cursor.execute(query,(id,))
    all_rows = cursor.fetchone()
    return all_rows[0]    

def add_descriptor(id,sift_features):
	cursor = conn.cursor()
	query = '''INSERT INTO sift(id, sift_features) VALUES (?,?)'''
	cursor.execute(query,(id,sift_features))
	conn.commit()

def read_img_file(image_data):
    img = Image.open(io.BytesIO(image_data))
    return img

def resize_img_to_array(img):
    height,width=img.size
    if height*width>2000*2000:
        k=math.sqrt(height*width/(2000*2000))
        img=img.resize(
            (round(height/k),round(width/k)), 
            Image.ANTIALIAS
        )
    img_array = np.array(img)
    return img_array

def calculate_descr(image_buffer):
    eps=1e-7
    img=read_img_file(image_buffer)
    img=resize_img_to_array(img)
    key_points, descriptors = sift.detectAndCompute(img, None)
    descriptors /= (descriptors.sum(axis=1, keepdims=True) + eps) #RootSift
    descriptors = np.sqrt(descriptors)    #RootSift
    return (key_points,descriptors)

def match_descriptors(IMAGE_SIMILARITIES,image_id,matches):
    good_matches = []
    good_matches_sum=1e-323
    for m,n in matches:
        if m.distance < 0.75*n.distance:
            good_matches.append(m)
            good_matches_sum+=m.distance
    if(len(good_matches)<5):
        return
    bestN=5
    topBestNSum=1e-323
    good_matches.sort(key=lambda match: match.distance)
    for match in good_matches[:bestN]:
        topBestNSum+=match.distance
    IMAGE_SIMILARITIES.append({"id": image_id, "avg_distance": -((bestN/topBestNSum)*(len(good_matches)/(good_matches_sum)))-(len(good_matches))})

def sift_reverse_search(image):
    IMAGE_SIMILARITIES=[]
    _,target_descriptors=calculate_descr(image)
    ids=get_all_ids()
    for id in ids:
        descs=convert_array(get_sift_features_by_id(id))
        matches = bf.knnMatch(target_descriptors,descs, k=2)
        match_descriptors(IMAGE_SIMILARITIES,id,matches)
    IMAGE_SIMILARITIES.sort(key=lambda image: image["avg_distance"])
    print(IMAGE_SIMILARITIES[:20])
    return list(map(lambda el: el["id"],IMAGE_SIMILARITIES[:20]))

app = FastAPI()
@app.get("/")
async def read_root():
    return {"Hello": "World"}

@app.post("/sift_reverse_search")
async def sift_reverse_search_handler(image: bytes = File(...)):
    images=sift_reverse_search(image)
    return images

@app.post("/calculate_sift_features")
async def calculate_sift_features_handler(image: bytes = File(...),image_id: str = Form(...)):
    _,descs=calculate_descr(image)
    add_descriptor(int(image_id),adapt_array(descs))
    return {"status":"200"}

class Item(BaseModel):
    image_id: str
@app.post("/delete_sift_features")
async def delete_sift_features_handler(item:Item):
    delete_descriptor_by_id(int(item.image_id))
    return {"status":"200"}

import uvicorn
if __name__ == '__main__':
    uvicorn.run('sift_web:app', host='127.0.0.1', port=33333, log_level="info")

print(__name__)
if __name__ == 'sift_web':
    sync_db()

