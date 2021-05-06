import uvicorn
if __name__ == '__main__':
    uvicorn.run('phash_web:app', host='127.0.0.1', port=33336, log_level="info")
    
from pydantic import BaseModel
from fastapi import FastAPI, File,Body,Form, HTTPException
from os import listdir
import numpy as np
import scipy.fft
from PIL import Image
from tqdm import tqdm
from numba import jit
import cv2
import sqlite3
import io
import hamming_search
conn = sqlite3.connect('phashes.db')

IMAGE_PATH="./../public/images"
ID_PHASH_dict={}

def init_index():
    all_data=get_all_data()
    for img in all_data:
        ID_PHASH_dict[img["image_id"]]=img["phash"]    
    print("Index is ready")
       
def read_img_file(image_data):
    return np.fromstring(image_data, np.uint8)

@jit(nopython=True)
def diff(dct, hash_size):
    dctlowfreq = dct[:hash_size, :hash_size]
    med = np.median(dctlowfreq)
    diff = dctlowfreq > med
    return diff.flatten()

def fast_phash(image, hash_size=16, highfreq_factor=4):
    img_size = hash_size * highfreq_factor
    image = cv2.resize(image, (img_size, img_size), interpolation=cv2.INTER_LINEAR)  #cv2.INTER_AREA
    dct = scipy.fft.dct(scipy.fft.dct(image, axis=0), axis=1)
    return diff(dct, hash_size)

@jit(nopython=True)
def bit_list_to_4_uint64(bit_list_256):
    uint64_arr=[]
    for i in range(4):
        bit_list=[]
        for j in range(64):
            if(bit_list_256[i*64+j]==True):
                bit_list.append(1)
            else:
                bit_list.append(0)
        uint64_arr.append(bit_list_to_int(bit_list))
    return np.array(uint64_arr,dtype=np.uint64)

@jit(nopython=True)
def bit_list_to_int(bitlist):
     out = 0
     for bit in bitlist:
         out = (out << 1) | bit
     return out

def get_phash(image_buffer):
    query_image=cv2.imdecode(read_img_file(image_buffer),cv2.IMREAD_GRAYSCALE)
    bit_list_256=fast_phash(query_image)
    phash=bit_list_to_4_uint64(bit_list_256)
    return phash

def create_table():
	cursor = conn.cursor()
	query = '''
	    CREATE TABLE IF NOT EXISTS phashes(
	    	id INTEGER NOT NULL UNIQUE PRIMARY KEY, 
	    	phash BLOB NOT NULL
	    )
	'''
	cursor.execute(query)
	conn.commit()

def check_if_exists_by_id(id):
    cursor = conn.cursor()
    query = '''SELECT EXISTS(SELECT 1 FROM phashes WHERE id=(?))'''
    cursor.execute(query,(id,))
    all_rows = cursor.fetchone()
    return all_rows[0] == 1    

def delete_descriptor_by_id(id):
	cursor = conn.cursor()
	query = '''DELETE FROM phashes WHERE id=(?)'''
	cursor.execute(query,(id,))
	conn.commit()

def get_all_ids():
    cursor = conn.cursor()
    query = '''SELECT id FROM phashes'''
    cursor.execute(query)
    all_rows = cursor.fetchall()
    return list(map(lambda el:el[0],all_rows))

def get_all_data():
    cursor = conn.cursor()
    query = '''
    SELECT id, phash
    FROM phashes
    '''
    cursor.execute(query)
    all_rows = cursor.fetchall()
    return list(map(lambda el:{"image_id":el[0],"phash":convert_array(el[1])},all_rows))

def convert_array(text):
    out = io.BytesIO(text)
    out.seek(0)
    return np.load(out)

def adapt_array(arr):
    out = io.BytesIO()
    np.save(out, arr)
    out.seek(0)
    return sqlite3.Binary(out.read())

def add_descriptor(id,phash):
	cursor = conn.cursor()
	query = '''INSERT INTO phashes(id, phash) VALUES (?,?)'''
	cursor.execute(query,(id,phash))
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

@app.post("/calculate_phash_features")
async def calculate_phash_features_handler(image: bytes = File(...),image_id: str = Form(...)):
    features=get_phash(image)
    add_descriptor(int(image_id),adapt_array(features))
    ID_PHASH_dict[int(image_id)]=features
    return {"status":"200"}

class Item_image_id(BaseModel):
    image_id: int

from timeit import default_timer as timer
@app.post("/phash_reverse_search")
async def phash_reverse_search_handler(image: bytes = File(...)):
    target_features=get_phash(image)
    start = timer()
    results=hamming_search.hamming_knn(target_features,np.array(list(ID_PHASH_dict.values())),np.array(list(ID_PHASH_dict.keys()),dtype=np.int32),20)
    end = timer()
    print((end - start)*1000)
    print(results)
    return list(map(lambda el:el[1],results))

           
@app.post("/delete_phash_features")
async def delete_hist_features_handler(item:Item_image_id):
    delete_descriptor_by_id(item.image_id)
    del ID_PHASH_dict[item.image_id]
    return {"status":"200"}

print(__name__)

if __name__ == 'phash_web':
    create_table()
    sync_db()
    init_index()



   
