import cv2
from os import listdir
import numpy as np
from joblib import Parallel, delayed

import sqlite3
import io
conn = sqlite3.connect('rgb_histograms.db')

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
    file_names=listdir(IMAGE_PATH)
    ids_in_db=set(get_all_ids())

    for file_name in file_names:
        file_id=int(file_name[:file_name.index('.')])
        if file_id in ids_in_db:
            ids_in_db.remove(file_id)
    for id in ids_in_db:
        delete_descriptor_by_id(id)   #Fix this
        print(f"deleting {id}")

def get_features(image_path):
    query_image=cv2.imread(image_path)
    if query_image.shape[2]==1:
        query_image=cv2.cvtColor(query_image,cv2.COLOR_GRAY2RGB)
    else:
        query_image=cv2.cvtColor(query_image,cv2.COLOR_BGR2RGB)
    query_hist_combined=cv2.calcHist([query_image],[0,1,2],None,[16,16,16],[0,255,0,255,0,255])
    query_hist_combined = query_hist_combined.flatten()
    query_hist_combined=cv2.divide(query_hist_combined,query_image.shape[0]*query_image.shape[1])
    return query_hist_combined

IMAGE_PATH="../public/images"
file_names=listdir(IMAGE_PATH)

create_table()
sync_db()
new_images=[]
for file_name in file_names:
    file_id=int(file_name[:file_name.index('.')])
    if check_if_exists_by_id(file_id):
        continue
    new_images.append(file_name)

def calc_hist(file_name):
    file_id=int(file_name[:file_name.index('.')])
    image_features=get_features(IMAGE_PATH+"/"+file_name) 
    image_features_bin=adapt_array(image_features)
    print(file_name)
    return (file_id,image_features_bin)

hists=Parallel(n_jobs=-1)(delayed(calc_hist)(file_name) for file_name in new_images)
conn.executemany('''INSERT INTO rgb_hists(id, rgb_histogram) VALUES (?,?)''', hists)
conn.commit()
