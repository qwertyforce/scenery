
import faiss
from os import remove
import numpy as np
import sqlite3
import io
from tqdm import tqdm
conn_import = sqlite3.connect('import_phashes.db')
conn = sqlite3.connect('phashes.db')

index = None
file_id_to_file_name_map = {}
IMAGE_PATH = "./../../../import/images"


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


def get_all_data():
    cursor = conn.cursor()
    query = '''
    SELECT id, phash
    FROM phashes
    '''
    cursor.execute(query)
    all_rows = cursor.fetchall()
    return list(map(lambda el: (el[0], convert_array(el[1])), all_rows))


def import_get_all_data():
    cursor = conn_import.cursor()
    query = '''
    SELECT id, phash
    FROM phashes
    '''
    cursor.execute(query)
    all_rows = cursor.fetchall()
    return list(map(lambda el: (el[0], convert_array(el[1])), all_rows))


def convert_array(text):
    out = io.BytesIO(text)
    out.seek(0)
    return np.load(out)


def phash_reverse_search(target_features):
    D, I = index.search(np.array([target_features]), 1)
    similar = []
    if D[0][0] <= 32:
        similar.append(int(I[0][0]))
    return similar
    

def dedup():
    global index
    all_data = get_all_data()
    if len(all_data) == 0:
        print("all_data no images. exit()")
        exit()
    try:
        index = faiss.read_index_binary("trained.index")
    except:
        index = faiss.read_index_binary("trained_import.index")

    image_ids = np.array([np.int64(x[0]) for x in all_data])
    phashes = np.array([x[1] for x in all_data])
    index.add_with_ids(phashes, image_ids)

    print("Index is ready")
    import_all_data = import_get_all_data()
    if len(import_all_data) == 0:
        print("import_all_data no images. exit()")
        exit()
    for x in tqdm(import_all_data):
        filename = x[0]
        features = x[1]
        res = phash_reverse_search(features)
        if len(res) != 0:
            print(f'duplicate {filename} - {res}')
            print(f'deleting {filename}')
            remove(f'{IMAGE_PATH}/{x[0]}')


create_table()
dedup()
