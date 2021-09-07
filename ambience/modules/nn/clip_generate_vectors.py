import torch
import clip
from os import listdir
import numpy as np
from PIL import Image
import sqlite3
import io
from tqdm import tqdm

conn = sqlite3.connect('NN_features.db')
IMAGE_PATH="./../../../public/images"

device = "cuda" if torch.cuda.is_available() else "cpu"
model, preprocess = clip.load("ViT-B/16")

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
    file_names=listdir(IMAGE_PATH)
    ids_in_db=set(get_all_ids())

    for file_name in file_names:
        file_id=int(file_name[:file_name.index('.')])
        if file_id in ids_in_db:
            ids_in_db.remove(file_id)
    for id in ids_in_db:
        delete_descriptor_by_id(id)   #Fix this
        print(f"deleting {id}")

def get_features(image):
    image =  preprocess(image).unsqueeze(0).to(device)
    with torch.no_grad():
        image_features = model.encode_image(image)
        image_features /= image_features.norm(dim=-1, keepdim=True)
    return image_features.numpy()

file_names=listdir(IMAGE_PATH)
create_table()
sync_db()
new_images=[]
for file_name in file_names:
    file_id=int(file_name[:file_name.index('.')])
    if check_if_exists_by_id(file_id):
        continue
    new_images.append(file_name)

def calc_nn_features(file_name):
    file_id=int(file_name[:file_name.index('.')])
    img_path=IMAGE_PATH+"/"+file_name
    try:
        query_image=Image.open(img_path)
    except:
        print(f'error reading {img_path}')
        return None
    image_features=get_features(query_image) 
    image_features_bin=adapt_array(image_features)
    return (file_id,image_features_bin)

new_images=[new_images[i:i + 5000] for i in range(0, len(new_images), 5000)]
for batch in new_images:
    batch_features=[]
    for file_name in tqdm(batch):
        batch_features.append(calc_nn_features(file_name))
    batch_features= [i for i in batch_features if i] #remove None's
    print("pushing data to db")
    conn.executemany('''INSERT INTO clip(id, clip_features) VALUES (?,?)''', batch_features)
    conn.commit()