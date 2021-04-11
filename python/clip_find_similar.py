from sklearn.neighbors import NearestNeighbors
from os import listdir
import numpy as np
import json

import sqlite3
import io
conn = sqlite3.connect('NN_features.db')

def convert_array(text):
    out = io.BytesIO(text)
    out.seek(0)
    return np.load(out)

def get_all_data():
    cursor = conn.cursor()
    query = '''SELECT id, clip_features FROM clip'''
    cursor.execute(query)
    all_rows = cursor.fetchall()
    return list(map(lambda el:{"image_id":el[0],"features":convert_array(el[1])},all_rows))

image_data=get_all_data()
features=[]
for image in image_data:
    features.append(image['features'])
features=np.array(features).squeeze()

IMAGE_PATH="../public/images"
knn = NearestNeighbors(n_neighbors=20,algorithm='brute',metric='euclidean')
knn.fit(features)
file_names=listdir(IMAGE_PATH)
ALL_SIMILAR_IMAGES={}
for image in image_data:
    print(image['image_id'])
    indices = knn.kneighbors(image['features'], return_distance=False)
    similar_images=[]
    for i in range(indices[0].size):
        similar_images.append(image_data[indices[0][i]]['image_id'])
    ALL_SIMILAR_IMAGES[image['image_id']]=similar_images
with open('data.txt', 'w') as outfile:
    json.dump(ALL_SIMILAR_IMAGES, outfile)


