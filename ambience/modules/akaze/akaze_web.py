import uvicorn
if __name__ == '__main__':
    uvicorn.run('akaze_web:app', host='127.0.0.1', port=33333, log_level="info")
import faiss
import cv2
from os import listdir
import numpy as np
import math
from tqdm import tqdm
from fastapi import FastAPI, File,Form,HTTPException
from pydantic import BaseModel
import sqlite3
import io
conn = sqlite3.connect('akaze.db')
AKAZE = cv2.AKAZE_create()
index=None
point_id_to_image_id_map={}
image_id_to_point_ids_map={}

IMAGE_PATH="./../../../public/images"
POINT_ID=0

def init_index():
    global index,POINT_ID
    index = faiss.read_index_binary("trained.index")
    all_ids=get_all_ids()
    for image_id in tqdm(all_ids):
        features = convert_array(get_akaze_features_by_id(image_id))
        point_ids=np.arange(start=POINT_ID, stop=POINT_ID+len(features),dtype=np.int64)
        for point_id in point_ids:
            point_id_to_image_id_map[point_id]=image_id
        image_id_to_point_ids_map[image_id]=point_ids
        POINT_ID+=len(features)
        index.add_with_ids(features, point_ids)
    print("Index is ready")

def create_table():
	cursor = conn.cursor()
	query = '''
	    CREATE TABLE IF NOT EXISTS akaze(
	    	id INTEGER NOT NULL UNIQUE PRIMARY KEY, 
	    	akaze_features BLOB NOT NULL
	    )
	'''
	cursor.execute(query)
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

def add_descriptor(id,akaze_features):
	cursor = conn.cursor()
	query = '''INSERT INTO akaze(id, akaze_features )VALUES (?,?)'''
	cursor.execute(query,(id,akaze_features))
	conn.commit()

def delete_descriptor_by_id(id):
	cursor = conn.cursor()
	query = '''DELETE FROM akaze WHERE id=(?)'''
	cursor.execute(query,(id,))
	conn.commit()

def get_all_ids():
    cursor = conn.cursor()
    query = '''SELECT id FROM akaze'''
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

def get_akaze_features_by_id(id):
    cursor = conn.cursor()
    query = '''
    SELECT akaze_features
    FROM akaze
    WHERE id = (?)
    '''
    cursor.execute(query,(id,))
    all_rows = cursor.fetchone()
    return all_rows[0]    

def add_descriptor(id,akaze_features):
	cursor = conn.cursor()
	query = '''INSERT INTO akaze(id, akaze_features) VALUES (?,?)'''
	cursor.execute(query,(id,akaze_features))
	conn.commit()

def read_img_file(image_data):
    return np.fromstring(image_data, np.uint8)

def resize_img_to_array(img):
    height,width=img.shape
    threshold=3000*3000
    if height*width>threshold:
        k=math.sqrt(height*width/(threshold))
        img=cv2.resize(img, (round(width/k),round(height/k)), interpolation=cv2.INTER_LINEAR)
    return img


def calculate_descr(image_buffer):
    img=cv2.imdecode(read_img_file(image_buffer),0)
    img=resize_img_to_array(img)
    height= img.shape[0]
    width= img.shape[1]
    height_divided_by_2 = img.shape[0]//2
    width_divided_by_2 = img.shape[1]//2
    kps = AKAZE.detect(img,None)
    if kps is None:
        return None
    kps = sorted(kps, key = lambda x:x.response,reverse=True)
    descriptors_count=[0,0,0,0]
    keypoints=[]
    for keypoint in kps:
        keypoint_y,keypoint_x=keypoint.pt
        if sum(descriptors_count) == 64*4:
            break
        if descriptors_count[0]<64 and 0<keypoint_x<height_divided_by_2 and 0<keypoint_y<width_divided_by_2:
            keypoints.append(keypoint)
            descriptors_count[0]+=1
            continue

        if descriptors_count[1]<64 and 0<keypoint_x<height_divided_by_2 and width_divided_by_2<keypoint_y<width:
            keypoints.append(keypoint)
            descriptors_count[1]+=1
            continue

        if descriptors_count[2]<64 and height_divided_by_2<keypoint_x<height and 0<keypoint_y<width_divided_by_2:
            keypoints.append(keypoint)
            descriptors_count[2]+=1
            continue

        if descriptors_count[3]<64 and height_divided_by_2<keypoint_x<height and 0<width_divided_by_2<keypoint_y<width:
            keypoints.append(keypoint)
            descriptors_count[3]+=1
            continue
    _,desc1 = AKAZE.compute(img, keypoints)
    return desc1

"""
akaze_reverse_search
level  - hamming distance range - points to be considered as a match
level 0 - <=5 - 2
level 1 - <=10 - 4
level 2 - <=15 - 6
level 3 - <=32 - 12
"""
levels_threshold=[2,4,6,12]

def median(lst):
    list_length = len(lst)
    index = (list_length - 1) // 2
    if (list_length % 2):
        return lst[index][1]
    else:
        return (lst[index][1] + lst[index + 1][1])/2.0

def akaze_reverse_search(image_buffer):
    levels = [{}, {}, {}, {}]
    all_points={}
    descs = calculate_descr(image_buffer)
    if descs is None:
        return []
    D, I = index.search(descs, 1)
    for i in range(len(I)):
        point_dist = D[i][0]
        if(point_dist > 65):
            continue
        point_id = I[i][0]
        image_id = point_id_to_image_id_map[point_id]
        if point_dist <= 5:
           levels[0][image_id] = levels[0].get(image_id, 0)+1
        if point_dist <= 10:
            levels[1][image_id] = levels[1].get(image_id, 0)+1
        if point_dist <= 15:
            levels[2][image_id] = levels[2].get(image_id, 0)+1
        if point_dist <= 32:
            levels[3][image_id] = levels[3].get(image_id, 0)+1
        all_points[image_id] = all_points.get(image_id, 0)+1
    print(levels)
    for i in range(4):
        if(len(levels[i])>0):
            sorted_levels = sorted(levels[i].items(), key=lambda item: item[1])
            if sorted_levels[-1][1] >= levels_threshold[i]:
                print({"data": sorted_levels[-1], "level": i})
                return [sorted_levels[-1][0]]
    sorted_all_points=sorted(all_points.items(), key=lambda item: item[1])
    print(sorted_all_points)
    median_number_of_points=median(sorted_all_points)
    print(f'median = {median_number_of_points}')
    if len(sorted_all_points)>=2 and sorted_all_points[-1][1]>=10:
        if((sorted_all_points[-1][1]/median_number_of_points)>=3):
            print(sorted_all_points[-1])
            return [sorted_all_points[-1][0]]
    return []


app = FastAPI()
@app.get("/")
async def read_root():
    return {"Hello": "World"}

@app.post("/akaze_reverse_search")
async def akaze_reverse_search_handler(image: bytes = File(...)):
    found_image=akaze_reverse_search(image)
    return found_image

@app.post("/calculate_akaze_features")
async def calculate_akaze_features_handler(image: bytes = File(...),image_id: str = Form(...)):
    global POINT_ID
    image_id=int(image_id)
    descs=calculate_descr(image)
    if descs is None:
        raise HTTPException(status_code=500, detail="No descritors for this image")
    add_descriptor(image_id,adapt_array(descs))
    point_ids=np.arange(start=POINT_ID, stop=POINT_ID+len(descs),dtype=np.int64)
    POINT_ID+=len(descs)
    for point_id in point_ids:
        point_id_to_image_id_map[point_id]=image_id
    image_id_to_point_ids_map[image_id]=point_ids
    index.add_with_ids(descs, point_ids)
    return {"status":"200"}

class Item(BaseModel):
    image_id: str
@app.post("/delete_akaze_features")
async def delete_akaze_features_handler(item:Item):
    image_id=int(item.image_id)
    delete_descriptor_by_id(image_id)
    point_ids=image_id_to_point_ids_map[image_id]
    index.remove_ids(point_ids)
    for point_id in point_ids:
        del point_id_to_image_id_map[point_id]
    del image_id_to_point_ids_map[image_id]
    return {"status":"200"}

print(__name__)
if __name__ == 'akaze_web':
    create_table()
    sync_db()
    init_index()

