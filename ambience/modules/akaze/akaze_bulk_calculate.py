import cv2
import numpy as np
from os import listdir
import math
from joblib import Parallel, delayed
import sqlite3
import io
conn = sqlite3.connect('akaze.db')
IMAGE_PATH="./../../../public/images"

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

def check_if_exists_by_id(id):
    cursor = conn.cursor()
    query = '''SELECT EXISTS(SELECT 1 FROM akaze WHERE id=(?))'''
    cursor.execute(query,(id,))
    all_rows = cursor.fetchone()
    return all_rows[0] == 1    

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

def add_descriptor(id,akaze_features):
	cursor = conn.cursor()
	query = '''INSERT INTO akaze(id, akaze_features) VALUES (?,?)'''
	cursor.execute(query,(id,akaze_features))
	conn.commit()

def resize_img_to_array(img):
    height,width=img.shape
    threshold=3000*3000
    if height*width>threshold:
        k=math.sqrt(height*width/(threshold))
        img=cv2.resize(img, (round(width/k),round(height/k)), interpolation=cv2.INTER_LINEAR)
    return img

def calculate_descr(img):
    AKAZE = cv2.AKAZE_create()  #can't serialize, hence init is here
    img=resize_img_to_array(img)
    height= img.shape[0]
    width= img.shape[1]
    height_divided_by_2 = img.shape[0]//2
    width_divided_by_2 = img.shape[1]//2
    kps = AKAZE.detect(img,None)
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

def sync_db():
    ids_in_db=set(get_all_ids())

    for file_name in file_names:
        file_id=int(file_name[:file_name.index('.')])
        if file_id in ids_in_db:
            ids_in_db.remove(file_id)
    for id in ids_in_db:
        delete_descriptor_by_id(id)   #Fix this
        print(f"deleting {id}")

file_names=listdir(IMAGE_PATH)
create_table()
sync_db()
new_images=[]
for file_name in file_names:
    file_id=int(file_name[:file_name.index('.')])
    if check_if_exists_by_id(file_id):
        continue
    new_images.append(file_name)

def calc_features(file_name):
    file_id=int(file_name[:file_name.index('.')])
    img_path=IMAGE_PATH+"/"+file_name
    query_image=cv2.imread(img_path,0)
    if query_image is None:
        return None
    descs=calculate_descr(query_image)
    descs_bin=adapt_array(descs)
    print(file_name)
    return (file_id,descs_bin)


new_images=[new_images[i:i + 5000] for i in range(0, len(new_images), 5000)]
for batch in new_images:
    descriptors=Parallel(n_jobs=-1,verbose=1)(delayed(calc_features)(file_name) for file_name in batch)
    descriptors= [i for i in descriptors if i] #remove None's
    conn.executemany('''INSERT INTO akaze(id, akaze_features) VALUES (?,?)''', descriptors)
    conn.commit()