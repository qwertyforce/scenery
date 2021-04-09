import cv2
import numpy as np
from PIL import Image
from os import listdir
import pickle as pk
import math
sift = cv2.SIFT_create(nfeatures=500)

import sqlite3
import io
conn = sqlite3.connect('sift.db')

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

def check_if_exists_by_id(id):
    cursor = conn.cursor()
    query = '''
    SELECT EXISTS(SELECT 1 FROM sift WHERE id=(?))
    '''
    cursor.execute(query,(id,))
    all_rows = cursor.fetchone()
    return all_rows[0] == 1    

def delete_descriptor_by_id(id):
	cursor = conn.cursor()
	query = '''
	    DELETE FROM sift WHERE id=(?)	'''
	cursor.execute(query,(id,))
	conn.commit()

def get_all_ids():
    cursor = conn.cursor()
    query = '''
    SELECT id
    FROM sift
    '''
    cursor.execute(query)
    all_rows = cursor.fetchall()
    return list(map(lambda el:el[0],all_rows))

def adapt_array(arr):
    out = io.BytesIO()
    np.save(out, arr)
    out.seek(0)
    return sqlite3.Binary(out.read())

def add_descriptor(id,sift_features):
	cursor = conn.cursor()
	query = '''
	    INSERT INTO sift(id, sift_features )
	    	        VALUES (?,?)
	'''
	cursor.execute(query,(id,sift_features))
	conn.commit()

create_table()


def read_img_file(f):
    img = Image.open(f)
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

def calculate_descr(f):
    eps=1e-7
    img=read_img_file(f)
    img=resize_img_to_array(img)
    key_points, descriptors = sift.detectAndCompute(img, None)
    descriptors /= (descriptors.sum(axis=1, keepdims=True) + eps) #RootSift
    descriptors = np.sqrt(descriptors)    #RootSift
    return (key_points,descriptors)

def sync_db():
    ids_in_db=set(get_all_ids())

    for file_name in file_names:
        file_id=int(file_name[:file_name.index('.')])
        if file_id in ids_in_db:
            ids_in_db.remove(file_id)
    for id in ids_in_db:
        delete_descriptor_by_id(id)   #Fix this
        print(f"deleting {id}")

path="./../public/images"
file_names=listdir(path)
sync_db()
# descs = []
for file_name in file_names:
    file_id=int(file_name[:file_name.index('.')])
    if check_if_exists_by_id(file_id):
        continue
    keyp,descs=calculate_descr(path+"/"+file_name)
    if descs is None:
        continue
    descs_bin=adapt_array(descs)
    add_descriptor(file_id,descs_bin)
    print(file_name)
    # pk.dump(descs, open(f"./features/{}","wb"))