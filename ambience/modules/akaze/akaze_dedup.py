
import faiss
from os import remove
import numpy as np
import sqlite3
import io

conn_import = sqlite3.connect('import_akaze.db')
conn = sqlite3.connect('akaze.db')

index=None
POINT_ID=0
point_id_to_image_id_map={}
image_id_to_point_ids_map={}
IMAGE_PATH="./../../../import/images"
      
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

def get_all_data():
    cursor = conn.cursor()
    query = '''
    SELECT id, akaze_features
    FROM akaze
    '''
    cursor.execute(query)
    all_rows = cursor.fetchall()
    return list(map(lambda el:(el[0],convert_array(el[1])),all_rows))

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

levels_threshold=[2,4,6,12]

def median(lst):
    list_length = len(lst)
    index = (list_length - 1) // 2
    if (list_length % 2):
        return lst[index][1]
    else:
        return (lst[index][1] + lst[index + 1][1])/2.0
        
def akaze_reverse_search(target_features):
    levels = [{}, {}, {}, {}]
    all_points={}
    D, I = index.search(target_features, 1)
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
    for i in range(4):
        if(len(levels[i])>0):
            sorted_levels = sorted(levels[i].items(), key=lambda item: item[1])
            if sorted_levels[-1][1] >= levels_threshold[i]:
                # print({"data": sorted_levels[-1], "level": i})
                return [sorted_levels[-1][0]]
    if len(all_points)>=2:
        sorted_all_points=sorted(all_points.items(), key=lambda item: item[1])
        median_number_of_points=median(sorted_all_points)
        if sorted_all_points[-1][1]>=10:
            if((sorted_all_points[-1][1]/median_number_of_points)>=3):
                print(sorted_all_points[-1])
                return [sorted_all_points[-1][0]]
    return []

def dedup():
    global index,POINT_ID
    index = faiss.read_index_binary("trained_import.index")
    all_data=get_all_data()
    for obj in all_data:
        image_id=obj[0]
        features = obj[1]
        point_ids=np.arange(start=POINT_ID, stop=POINT_ID+len(features),dtype=np.int64)
        for point_id in point_ids:
            point_id_to_image_id_map[point_id]=image_id
        image_id_to_point_ids_map[image_id]=point_ids
        POINT_ID+=len(features)
        index.add_with_ids(features, point_ids)
    print("Index is ready")

    import_all_data=import_get_all_data()

    for x in import_all_data:
        filename=x[0]
        features=x[1]
        res=akaze_reverse_search(features)
        if len(res)==0:
            point_ids=np.arange(start=POINT_ID, stop=POINT_ID+len(features),dtype=np.int64)
            POINT_ID+=len(features)
            for point_id in point_ids:
                point_id_to_image_id_map[point_id]=filename
            image_id_to_point_ids_map[filename]=point_ids
            index.add_with_ids(features, point_ids)
        else:
            print(f'duplicate {filename} - {res}')
            print(f'deleting {filename}')
            remove(f'{IMAGE_PATH}/{x[0]}')
create_table()
dedup()
