from keras.applications.resnet50 import ResNet50
from keras.applications.resnet50 import preprocess_input
from sklearn.neighbors import NearestNeighbors
from os import listdir
import numpy as np
from PIL import Image
import pickle as pk
import json
from pathlib import Path

model = ResNet50(weights='imagenet', include_top=False,input_shape=(224, 224, 3),pooling='max')
image_features=pk.load( open("image_features.pkl", "rb"))
features=[]
for image in image_features:
    features.append(np.array(image['features']))
features=np.array(features)
path="../public/images"
knn = NearestNeighbors(n_neighbors=20,algorithm='brute',metric='euclidean')
knn.fit(features)
file_names=listdir(path)
ALL_SIMILAR_IMAGES={}
for image in image_features:
    print(image['image_id'])
    indices = knn.kneighbors(np.array(image['features']).reshape(1,-1), return_distance=False)
    similar_images=[]
    for i in range(indices[0].size):
        similar_images.append(image_features[indices[0][i]]['image_id'])
    ALL_SIMILAR_IMAGES[image['image_id']]=similar_images
with open('data.txt', 'w') as outfile:
    json.dump(ALL_SIMILAR_IMAGES, outfile)


