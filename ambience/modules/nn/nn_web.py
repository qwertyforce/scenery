import uvicorn
if __name__ == '__main__':
    uvicorn.run('nn_web:app', host='127.0.0.1', port=33334, log_level="info")

from os import listdir,getcwd,path,chdir
old_cwd=getcwd()
chdir(path.join(getcwd(),"modules"))
from modules.img_tag_module import tag
chdir(old_cwd)

import torch
from pydantic import BaseModel
from fastapi import FastAPI, File,Form, HTTPException
import clip
import numpy as np
from PIL import Image

device = "cuda" if torch.cuda.is_available() else "cpu"
model, preprocess = clip.load("ViT-B/16")
IMAGE_PATH="./../../../public/images"

import sqlite3
import io
conn = sqlite3.connect('NN_features.db')

import hnswlib
dim=512
index = hnswlib.Index(space='l2', dim=dim)
index.init_index(max_elements=50000, ef_construction=200, M=32)

def init_index():
    image_data=get_all_data()
    features=[]
    ids=[]
    for image in image_data:
        features.append(image['features'])
        ids.append(image['image_id'])
    ids=np.array(ids)
    features=np.array(features).squeeze()
    if(len(features)!=0):
        index.add_items(features,ids)
    print("Index is ready")
       
def read_img_file(image_data):
    img = Image.open(io.BytesIO(image_data)).convert("RGB")
    return img

def get_features(image_buffer):
    image =  preprocess(read_img_file(image_buffer)).unsqueeze(0).to(device)
    with torch.no_grad():
        image_features = model.encode_image(image)
        image_features /= image_features.norm(dim=-1, keepdim=True)
    return image_features.numpy()

def create_table():
	cursor = conn.cursor()
	query = '''
	    CREATE TABLE IF NOT EXISTS clip(
	    	id INTEGER NOT NULL UNIQUE PRIMARY KEY, 
	    	clip_features BLOB NOT NULL
	    )
	'''
	cursor.execute(query)
	conn.commit()

def check_if_exists_by_id(id):
    cursor = conn.cursor()
    query = '''SELECT EXISTS(SELECT 1 FROM clip WHERE id=(?))'''
    cursor.execute(query,(id,))
    all_rows = cursor.fetchone()
    return all_rows[0] == 1    

def delete_descriptor_by_id(id):
	cursor = conn.cursor()
	query = '''DELETE FROM clip WHERE id=(?)'''
	cursor.execute(query,(id,))
	conn.commit()

def get_all_ids():
    cursor = conn.cursor()
    query = '''SELECT id FROM clip'''
    cursor.execute(query)
    all_rows = cursor.fetchall()
    return list(map(lambda el:el[0],all_rows))
    
def convert_array(text):
    out = io.BytesIO(text)
    out.seek(0)
    return np.load(out)

def get_all_data():
    cursor = conn.cursor()
    query = '''
    SELECT id, clip_features
    FROM clip
    '''
    cursor.execute(query)
    all_rows = cursor.fetchall()
    return list(map(lambda el:{"image_id":el[0],"features":convert_array(el[1])},all_rows))

def adapt_array(arr):
    out = io.BytesIO()
    np.save(out, arr)
    out.seek(0)
    return sqlite3.Binary(out.read())

def add_descriptor(id,clip_features):
	cursor = conn.cursor()
	query = '''INSERT INTO clip(id, clip_features) VALUES (?,?)'''
	cursor.execute(query,(id,clip_features))
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

def get_text_features(text):
    text_tokenized = clip.tokenize([text]).to(device)
    with torch.no_grad():
        text_features = model.encode_text(text_tokenized)
        text_features /= text_features.norm(dim=-1, keepdim=True)
    return text_features.numpy()
    
app = FastAPI()
@app.get("/")
async def read_root():
    return {"Hello": "World"}

@app.post("/calculate_nn_features")
async def calculate_NN_features_handler(image: bytes = File(...),image_id: str = Form(...)):
    features=get_features(image)
    add_descriptor(int(image_id),adapt_array(features))
    index.add_items(features,[int(image_id)])
    return {"status":"200"}

class Item_image_id(BaseModel):
    image_id: int

@app.post("/delete_nn_features")
async def delete_nn_features_handler(item:Item_image_id):
    delete_descriptor_by_id(item.image_id)
    try:
    	index.mark_deleted(item.image_id)
    except RuntimeError:
    	print(f"err: no image with id {item.image_id}")
    return {"status":"200"}

@app.post("/nn_get_similar_images_by_id")
async def get_similar_images_by_id_handler(item: Item_image_id):
    try:
       target_features = index.get_items([item.image_id])
       labels, _ = index.knn_query(target_features, k=20)
       return labels[0].tolist()
    except RuntimeError:
        raise HTTPException(status_code=500, detail="Image with this id is not found")

@app.post("/nn_get_similar_images_by_image_buffer")
async def nn_get_similar_images_by_image_buffer_handler(image: bytes = File(...)):
    target_features=get_features(image)
    labels, _ = index.knn_query(target_features, k=20)
    return labels[0].tolist()

@app.post("/nn_get_image_tags_by_image_buffer")
async def nn_get_image_tags_by_image_buffer_handler(image: bytes = File(...)):
    tags = tag(image)
    return tags

class Item_query(BaseModel):
    query: str
@app.post("/nn_get_similar_images_by_text")
async def find_similar_by_text_handler(item:Item_query):
    text_features=get_text_features(item.query)
    labels, _ = index.knn_query(text_features, k=20)
    return labels[0].tolist()

print(__name__)
if __name__ == 'nn_web':
    create_table()
    sync_db()
    init_index()



   
