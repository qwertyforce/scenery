import faiss
import numpy as np
import sqlite3
import io
from tqdm import tqdm
conn_import = sqlite3.connect('import_akaze.db')

index = None
POINT_ID = 0
point_id_to_image_id_map = {}
image_id_to_point_ids_map = {}


def import_get_all_data():
    cursor = conn_import.cursor()
    query = '''
    SELECT id, akaze_features
    FROM akaze
    '''
    cursor.execute(query)
    all_rows = cursor.fetchall()
    return list(map(lambda el: (el[0], convert_array(el[1])), all_rows))


def convert_array(text):
    out = io.BytesIO(text)
    out.seek(0)
    return np.load(out)


def median(lst):
    list_length = len(lst)
    index = (list_length - 1) // 2
    if (list_length % 2):
        return lst[index][1]
    else:
        return (lst[index][1] + lst[index + 1][1])/2.0


def _akaze_reverse_search(D, I, file_name):
    levels_threshold = [2, 4, 6, 10]
    levels = [{}, {}, {}, {}]
    all_points = {}
    for i in range(len(I)):
        point_dist = D[i]
        if(point_dist > 65):
            continue
        point_id = I[i]
        image_id = point_id_to_image_id_map[point_id]
        if image_id == file_name:  # skip original image
            continue
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
        if(len(levels[i]) > 0):
            sorted_levels = sorted(levels[i].items(), key=lambda item: item[1])
            if sorted_levels[-1][1] >= levels_threshold[i]:
                print({"data": sorted_levels[-1], "level": i})
                return [sorted_levels[-1][0]]

    if len(all_points) >= 2:
        sorted_all_points = sorted(all_points.items(), key=lambda item: item[1])
        median_number_of_points = median(sorted_all_points)
        if sorted_all_points[-1][1] >= 10:
            if((sorted_all_points[-1][1]/median_number_of_points) >= 3):
                print(sorted_all_points[-1])
                return [sorted_all_points[-1][0]]
    return []


def akaze_reverse_search(target_features, file_name):
    D, I = index.search(target_features, 2)  
    res = _akaze_reverse_search(D.reshape(-1), I.reshape(-1), file_name)
    return res


def dedup():
    global index, POINT_ID
    try:
        index = faiss.read_index_binary("trained_import.index")
    except:
        print("trained_import.index not found. exit()")
        exit()
    all_data = import_get_all_data()

    for obj in tqdm(all_data):
        image_id = obj[0]
        features = obj[1]
        point_ids = np.arange(
            start=POINT_ID, stop=POINT_ID+len(features), dtype=np.int64)
        for point_id in point_ids:
            point_id_to_image_id_map[point_id] = image_id
        image_id_to_point_ids_map[image_id] = point_ids
        POINT_ID += len(features)
        index.add_with_ids(features, point_ids)

    print("Index is ready")
    deleted = []
    for x in all_data:
        filename = x[0]
        if filename in deleted:
            continue
        features = x[1]
        res = akaze_reverse_search(features, filename)
        if len(res) > 0 and res[0] != filename:
            print("=============")
            print(filename)
            print(res[0])
            print("=============")
            deleted.extend(res)
dedup()
