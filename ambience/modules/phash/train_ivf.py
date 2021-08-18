import sqlite3
import numpy as np
import io
import faiss
from math import sqrt
conn = sqlite3.connect('phashes.db')


def get_all_data():
    cursor = conn.cursor()
    query = '''
    SELECT phash
    FROM phashes
    '''
    cursor.execute(query)
    all_rows = cursor.fetchall()
    return list(map(lambda el: convert_array(el[0]), all_rows))


def convert_array(text):
    out = io.BytesIO(text)
    out.seek(0)
    return np.load(out)


def train():
    all_data = np.array(get_all_data())
    if len(all_data) == 0:
        print("No images. exit()")
        exit()
    d = 32*8
    centroids = round(sqrt(all_data.shape[0]))
    print(f'centroids: {centroids}')
    quantizer = faiss.IndexBinaryFlat(d)
    index = faiss.IndexBinaryIVF(quantizer, d, centroids)
    index.nprobe = 8
    index.train(all_data)
    faiss.write_index_binary(index, "./" + "trained.index")


train()
