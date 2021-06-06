import uvicorn
if __name__ == '__main__':
    uvicorn.run('phash_web:app', host='127.0.0.1', port=33336, log_level="info")
import faiss
from pydantic import BaseModel
from fastapi import FastAPI, File,Form, HTTPException
from os import listdir
import numpy as np
import scipy.fft
from numba import jit
import cv2
import sqlite3
import io
conn = sqlite3.connect('phashes.db')
index=None
IMAGE_PATH="./../../../public/images"

def init_index():
    global index
    try:
        index = faiss.read_index_binary("trained.index")
    except:
        d=32*8
        quantizer = faiss.IndexBinaryFlat(d)
        index = faiss.IndexBinaryIVF(quantizer, d, 1)
        index.nprobe = 1
        index.train(np.array([np.zeros(32)],dtype=np.uint8))
    all_data=get_all_data()
    image_ids=np.array([np.int64(x[0]) for x in all_data])
    phashes=np.array([x[1] for x in all_data])
    if len(all_data)!=0:
        index.add_with_ids(phashes, image_ids)    
    print("Index is ready")
       
def read_img_file(image_data):
    return np.fromstring(image_data, np.uint8)

@jit(nopython=True)
def bit_list_to_32_uint8(bit_list_256):
    uint64_arr=[]
    for i in range(32):
        bit_list=[]
        for j in range(8):
            if(bit_list_256[i*8+j]==True):
                bit_list.append(1)
            else:
                bit_list.append(0)
        uint64_arr.append(bit_list_to_int(bit_list))
    return np.array(uint64_arr,dtype=np.uint8)

@jit(nopython=True)
def bit_list_to_int(bitlist):
     out = 0
     for bit in bitlist:
         out = (out << 1) | bit
     return out

@jit(nopython=True)
def diff(dct, hash_size):
    dctlowfreq = dct[:hash_size, :hash_size]
    med = np.median(dctlowfreq)
    diff = dctlowfreq > med
    return diff.flatten()

def fast_phash(resized_image,hash_size):
    dct = scipy.fft.dct(scipy.fft.dct(resized_image, axis=0), axis=1)
    return diff(dct, hash_size)

def get_phash(image_buffer,hash_size=16, highfreq_factor=4):
    img_size = hash_size * highfreq_factor
    query_image=cv2.imdecode(read_img_file(image_buffer),cv2.IMREAD_GRAYSCALE)
    query_image = cv2.resize(query_image, (img_size, img_size), interpolation=cv2.INTER_LINEAR)  #cv2.INTER_AREA
    bit_list_256=fast_phash(query_image,hash_size)
    phash=bit_list_to_32_uint8(bit_list_256)
    return phash

def get_phash_and_mirrored_phash(image_buffer,hash_size=16, highfreq_factor=4):
    img_size = hash_size * highfreq_factor
    query_image=cv2.imdecode(read_img_file(image_buffer),cv2.IMREAD_GRAYSCALE)
    query_image = cv2.resize(query_image, (img_size, img_size), interpolation=cv2.INTER_LINEAR)  #cv2.INTER_AREA
    mirrored_query_image=cv2.flip(query_image,1)
    bit_list_256=fast_phash(query_image,hash_size)
    bit_list_256_mirrored=fast_phash(mirrored_query_image,hash_size)
    phash=bit_list_to_32_uint8(bit_list_256)
    mirrored_phash=bit_list_to_32_uint8(bit_list_256_mirrored)
    return np.array([phash,mirrored_phash])

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
    return list(map(lambda el:(el[0],convert_array(el[1])),all_rows))

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

def phash_reverse_search(image_buffer):
    target_features=get_phash_and_mirrored_phash(image_buffer)
    D, I = index.search(target_features, 1)
    print(D,I)
    for i in range(2):
        if D[i][0]<=32:
            return [int(I[i][0])]
    return []

app = FastAPI()
@app.get("/")
async def read_root():
    return {"Hello": "World"}

class Item_image_id(BaseModel):
    image_id: int

@app.post("/phash_reverse_search")
async def phash_reverse_search_handler(image: bytes = File(...)):
    found_image=phash_reverse_search(image)
    print(found_image)
    return found_image

@app.post("/calculate_phash_features")
async def calculate_phash_features_handler(image: bytes = File(...),image_id: str = Form(...)):
    features=get_phash(image)
    add_descriptor(int(image_id),adapt_array(features))
    index.add_with_ids(np.array([features]), np.int64([image_id]))
    return {"status":"200"}

@app.post("/delete_phash_features")
async def delete_hist_features_handler(item:Item_image_id):
    delete_descriptor_by_id(item.image_id)
    index.remove_ids(np.int64([item.image_id]))
    return {"status":"200"}

print(__name__)

if __name__ == 'phash_web':
    create_table()
    sync_db()
    init_index()



   
