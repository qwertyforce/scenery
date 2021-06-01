import cv2
from os import listdir
import numpy as np
from joblib import Parallel, delayed

import sqlite3
import io
conn = sqlite3.connect('rgb_histograms.db')
IMAGE_PATH="./../../../public/images"

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

def get_features(query_image):
    query_hist_combined=cv2.calcHist([query_image],[0,1,2],None,[16,16,16],[0,256,0,256,0,256])
    query_hist_combined = query_hist_combined.flatten()
    query_hist_combined=query_hist_combined*10000000
    query_hist_combined=np.divide(query_hist_combined,query_image.shape[0]*query_image.shape[1],dtype=np.float32)
    return query_hist_combined

def calc_hist(file_name):
    file_id=int(file_name[:file_name.index('.')])
    img_path=IMAGE_PATH+"/"+file_name
    query_image=cv2.imread(img_path)
    if query_image is None:
        print(f'error reading {img_path}')
        return None
    if query_image.shape[2]==1:
        query_image=cv2.cvtColor(query_image,cv2.COLOR_GRAY2RGB)
    else:
        query_image=cv2.cvtColor(query_image,cv2.COLOR_BGR2RGB)
    image_features=get_features(query_image) 
    image_features_bin=adapt_array(image_features)
    print(file_name)
    return (file_id,image_features_bin)

file_names=listdir(IMAGE_PATH)
create_table()
sync_db()
new_images=[]
for file_name in file_names:
    file_id=int(file_name[:file_name.index('.')])
    if check_if_exists_by_id(file_id):
        continue
    new_images.append(file_name)

new_images=[new_images[i:i + 5000] for i in range(0, len(new_images), 5000)]
for batch in new_images:
    hists=Parallel(n_jobs=-1)(delayed(calc_hist)(file_name) for file_name in batch)
    hists= [i for i in hists if i] #remove None's
    conn.executemany('''INSERT INTO rgb_hists(id, rgb_histogram) VALUES (?,?)''', hists)
    conn.commit()