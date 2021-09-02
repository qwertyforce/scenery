import sqlite3
import numpy as np
import io
import faiss
from math import sqrt
conn_import = sqlite3.connect('import_akaze.db')

def import_get_all_data():
    cursor = conn_import.cursor()
    query = '''
    SELECT id, akaze_features
    FROM akaze
    '''
    cursor.execute(query)
    all_rows = cursor.fetchall()
    return list(map(lambda el:(el[0],convert_array(el[1])),all_rows))

def convert_array(text):
    out = io.BytesIO(text)
    out.seek(0)
    return np.load(out)

def train():
    all_descriptors=[]
    all_data=import_get_all_data()
    if len(all_data)==0:
        print("No images. exit()")
        exit()
    for x in all_data:
        all_descriptors.append(x[1])
    all_descriptors=np.concatenate(all_descriptors, axis=0)

    d=61*8
    centroids = round(sqrt(all_descriptors.shape[0]))
    print(f'centroids: {centroids}')
    quantizer = faiss.IndexBinaryFlat(d)
    index = faiss.IndexBinaryIVF(quantizer, d, centroids)
    index.nprobe = 8
    index.train(all_descriptors)
    faiss.write_index_binary(index, "./" + "trained_import.index")
train()