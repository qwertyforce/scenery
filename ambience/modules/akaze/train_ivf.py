import sqlite3
import numpy as np
import io
import faiss
from math import sqrt
conn = sqlite3.connect('akaze.db')

def get_all_ids():
    cursor = conn.cursor()
    query = '''SELECT id FROM akaze'''
    cursor.execute(query)
    all_rows = cursor.fetchall()
    return list(map(lambda el:el[0],all_rows))  

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
def train():

    all_descriptors=[]
    all_ids=get_all_ids()
    for id in all_ids:
        x=convert_array(get_akaze_features_by_id(id))
        all_descriptors.append(x)
    all_descriptors=np.concatenate(all_descriptors, axis=0)

    d=61*8
    centroids = round(sqrt(all_descriptors.shape[0]))
    # centroids=8
    print(f'centroids: {centroids}')
    quantizer = faiss.IndexBinaryFlat(d)
    index = faiss.IndexBinaryIVF(quantizer, d, centroids)
    index.nprobe = 8
    index.train(all_descriptors)
    faiss.write_index_binary(index, "./" + "trained.index")
train()