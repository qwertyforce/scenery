from keras.applications.resnet50 import ResNet50
from keras.applications.resnet50 import preprocess_input
from sklearn.neighbors import NearestNeighbors
from os import listdir
import numpy as np
from PIL import Image
import pickle as pk
import json
from pathlib import Path

def read_img_file(f):
    img = Image.open(f)
    if img.mode != 'RGB':
        img = img.convert('RGB')
    return img

def resize_img_to_array(img, img_shape):
    img_array = np.array(
        img.resize(
            img_shape, 
            Image.ANTIALIAS
        )
    )    
    return img_array

def get_features(f):
    img_width, img_height = 224, 224
    img = read_img_file(f)
    
    np_img = resize_img_to_array(img, img_shape=(img_width, img_height))
    expanded_img_array = np.expand_dims(np_img, axis=0)
    preprocessed_img = preprocess_input(expanded_img_array)
    X_conv = model.predict(preprocessed_img)
    return X_conv[0]

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


