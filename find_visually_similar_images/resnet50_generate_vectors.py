from keras.applications.resnet50 import ResNet50
from keras.applications.resnet50 import preprocess_input
import os
from os import listdir
import numpy as np
from PIL import Image
import pickle as pk
from pymongo import MongoClient
client = MongoClient('mongodb://localhost:27017/')
db = client['Scenery']

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
arr=[]

path="../public/images"
file_names=listdir(path)
try:
    arr=pk.load(open("image_features.pkl", "rb"))
except (OSError, IOError) as e:
    print("file_not_found")
images=list(db.images.find({}))
def exists_in_arr(image_id):
    for image in arr:
        if image['image_id'] == image_id:
            # print("skipping "+ str(image_id))
            return True
    return False
def exists_in_db(image_id):
    for image in images:
        if image['id'] == image_id:
            return True
    return False

for_deletion=[]
for i in range(len(arr)):
    if not exists_in_db(arr[i]['image_id']):
        print("deleting "+ str(arr[i]['image_id']))
        for_deletion.append(i)
for i in reversed(for_deletion):
    del arr[i]


for image in images:
    image_filename=str(image['id'])+'.'+image['file_ext']
    if exists_in_arr(image['id']):
        continue;
    image_features=get_features(path+"/"+image_filename)
    print(image_filename)
    print(image_features)
    arr.append({'image_id':image['id'],'features':image_features})
pk.dump(arr, open("image_features.pkl","wb"))

