import cv2
import numpy as np
from os import listdir
import math
from joblib import Parallel, delayed
from numba import jit
from numba.core import types
from numba.typed import Dict

import sqlite3
import io
conn = sqlite3.connect('import_akaze.db')
IMAGE_PATH = "./../../../import/images"


def create_table():
    cursor = conn.cursor()
    query = '''
	    CREATE TABLE IF NOT EXISTS akaze(
	    	id TEXT NOT NULL UNIQUE PRIMARY KEY, 
	    	akaze_features BLOB NOT NULL
	    )
	'''
    cursor.execute(query)
    conn.commit()


def check_if_exists_by_id(id):
    cursor = conn.cursor()
    query = '''SELECT EXISTS(SELECT 1 FROM akaze WHERE id=(?))'''
    cursor.execute(query, (id,))
    all_rows = cursor.fetchone()
    return all_rows[0] == 1


def delete_descriptor_by_id(id):
    cursor = conn.cursor()
    query = '''DELETE FROM akaze WHERE id=(?)'''
    cursor.execute(query, (id,))
    conn.commit()


def get_all_ids():
    cursor = conn.cursor()
    query = '''SELECT id FROM akaze'''
    cursor.execute(query)
    all_rows = cursor.fetchall()
    return list(map(lambda el: el[0], all_rows))


def adapt_array(arr):
    out = io.BytesIO()
    np.save(out, arr)
    out.seek(0)
    return sqlite3.Binary(out.read())


def add_descriptor(id, akaze_features):
    cursor = conn.cursor()
    query = '''INSERT INTO akaze(id, akaze_features) VALUES (?,?)'''
    cursor.execute(query, (id, akaze_features))
    conn.commit()


def resize_img_to_threshold(img):
    height, width = img.shape
    threshold = 3000*3000
    if height*width > threshold:
        k = math.sqrt(height*width/(threshold))
        img = cv2.resize(img, (round(width/k), round(height/k)), interpolation=cv2.INTER_LINEAR)
    return img


@jit(nopython=True, cache=True, fastmath=True)
def check_distance(keypoint_x, keypoint_y, keypoints, keypoints_neighbors):
    skip_flag = False
    for keyp in keypoints:
        if keyp[0] == 0 and keyp[1] == 0: #_keypoints is zeroed
            break
        dist = math.sqrt((keypoint_x-keyp[0])**2 + (keypoint_y-keyp[1])**2)
        if dist < 40:
            pseudohash = keyp[0]+keyp[1]
            if not pseudohash in keypoints_neighbors:
                keypoints_neighbors[pseudohash] = 1
            if keypoints_neighbors[pseudohash] >= 3:
                skip_flag = True
                continue
            else:
                keypoints_neighbors[pseudohash] += 1
    return skip_flag


def calculate_descr(img):
    AKAZE = cv2.AKAZE_create(threshold=0) # can't serialize, hence init is here
    img = resize_img_to_threshold(img)
    height = img.shape[0]
    width = img.shape[1]
    height_divided_by_2 = height//2
    width_divided_by_2 = width//2
    kps = AKAZE.detect(img, None)
    kps = sorted(kps, key=lambda x: x.response, reverse=True)
    descriptors_count = [0, 0, 0, 0]
    keypoints = []
    _keypoints = np.zeros((256, 2))
    keypoints_neighbors = Dict.empty(key_type=types.float64, value_type=types.int64)
    for keypoint in kps:
        keypoint_x, keypoint_y = keypoint.pt
        if len(keypoints) != 0:
            skip_keypoint = check_distance(keypoint_x, keypoint_y, _keypoints, keypoints_neighbors)
            if skip_keypoint:
                continue
        if sum(descriptors_count) == 64*4:
            break
        if descriptors_count[0] < 64 and 0 < keypoint_y < height_divided_by_2 and 0 < keypoint_x < width_divided_by_2:
            keypoints.append(keypoint)
            _keypoints[len(keypoints)-1][0] = keypoint.pt[0]
            _keypoints[len(keypoints)-1][1] = keypoint.pt[1]
            descriptors_count[0] += 1
            continue

        if descriptors_count[1] < 64 and 0 < keypoint_y < height_divided_by_2 and width_divided_by_2 < keypoint_x < width:
            keypoints.append(keypoint)
            _keypoints[len(keypoints)-1][0] = keypoint.pt[0]
            _keypoints[len(keypoints)-1][1] = keypoint.pt[1]
            descriptors_count[1] += 1
            continue

        if descriptors_count[2] < 64 and height_divided_by_2 < keypoint_y < height and 0 < keypoint_x < width_divided_by_2:
            keypoints.append(keypoint)
            _keypoints[len(keypoints)-1][0] = keypoint.pt[0]
            _keypoints[len(keypoints)-1][1] = keypoint.pt[1]
            descriptors_count[2] += 1
            continue

        if descriptors_count[3] < 64 and height_divided_by_2 < keypoint_y < height and 0 < width_divided_by_2 < keypoint_x < width:
            keypoints.append(keypoint)
            _keypoints[len(keypoints)-1][0] = keypoint.pt[0]
            _keypoints[len(keypoints)-1][1] = keypoint.pt[1]
            descriptors_count[3] += 1
            continue
    _, desc1 = AKAZE.compute(img, keypoints)
    return desc1


def sync_db():
    ids_in_db = set(get_all_ids())
    for file_name in file_names:
        if file_name in ids_in_db:
            ids_in_db.remove(file_name)
    for id in ids_in_db:
        delete_descriptor_by_id(id)  # Fix this
        print(f"deleting {id}")


def calc_features(file_name):
    img_path = IMAGE_PATH+"/"+file_name
    query_image = cv2.imread(img_path, 0)
    if query_image is None:
        return None
    descs = calculate_descr(query_image)
    if descs is None:
        return None
    descs_bin = adapt_array(descs)
    print(file_name)
    return (file_name, descs_bin)


file_names = listdir(IMAGE_PATH)
create_table()
sync_db()
new_images = []
for file_name in file_names:
    if check_if_exists_by_id(file_name):
        continue
    new_images.append(file_name)

new_images = [new_images[i:i + 5000] for i in range(0, len(new_images), 5000)]
for batch in new_images:
    descriptors = Parallel(n_jobs=-1, verbose=1)(delayed(calc_features)(file_name) for file_name in batch)
    descriptors = [i for i in descriptors if i]  # remove None's
    print("pushing data to db")
    conn.executemany('''INSERT INTO akaze(id, akaze_features) VALUES (?,?)''', descriptors)
    conn.commit()
