import os
import torch
import clip
from os import listdir
from os.path import splitext
import numpy as np
import json
from PIL import Image
import pickle as pk
from fastapi import FastAPI, File, UploadFile,Body,Form
from pydantic import BaseModel
import uvicorn
from sklearn.neighbors import NearestNeighbors

device = "cuda" if torch.cuda.is_available() else "cpu"
model, preprocess = clip.load("ViT-B/32")
IMAGES_PATH="./public/images"

def get_features(image_path):
    image =  preprocess(Image.open(image_path)).unsqueeze(0).to(device)
    with torch.no_grad():
        image_features = model.encode_image(image)
        image_features /= image_features.norm(dim=-1, keepdim=True)
    return image_features.numpy()

def generate_clip_features():
    all_image_features=[]
    image_filenames=listdir(IMAGES_PATH)
    image_ids=set(map(lambda el: splitext(el)[0],image_filenames))
    try:
       all_image_features=pk.load(open("./python/clip_image_features.pkl", "rb"))
    except (OSError, IOError) as e:
       print("file_not_found")

    def exists_in_all_image_features(image_id):
        for image in all_image_features:
            if image['image_id'] == image_id:
                # print("skipping "+ str(image_id))
                return True
        return False

    def exists_in_image_folder(image_id):
        if image_id in image_ids:
                return True
        return False   

    def sync_clip_image_features():
        for_deletion=[]
        for i in range(len(all_image_features)):
            if not exists_in_image_folder(all_image_features[i]['image_id']):
                print("deleting "+ str(all_image_features[i]['image_id']))
                for_deletion.append(i)
        for i in reversed(for_deletion):
            del all_image_features[i]

    sync_clip_image_features()
    for image_filename in image_filenames:
        image_id=splitext(image_filename)[0]
        if exists_in_all_image_features(image_id):
            continue
        image_features=get_features(IMAGES_PATH+"/"+image_filename)
        # print(image_filename)
        # print(image_features)
        all_image_features.append({'image_id':image_id,'features':image_features})
    pk.dump(all_image_features, open("./python/clip_image_features.pkl","wb"))

def calculate_similarities():
    all_image_features=[]
    image_filenames=listdir(IMAGES_PATH)
    image_ids=set(map(lambda el: splitext(el)[0],image_filenames))
    try:
       all_image_features=pk.load(open("./python/clip_image_features.pkl", "rb"))
    except (OSError, IOError) as e:
       print("file_not_found")
    features=[]
    for image in all_image_features:
        features.append(np.array(image['features']))
    features=np.array(features)
    features=np.squeeze(features)
    knn = NearestNeighbors(n_neighbors=20,algorithm='brute',metric='euclidean')
    knn.fit(features)
    file_names=listdir(IMAGES_PATH)
    ALL_SIMILAR_IMAGES={}
    for image in all_image_features:
        # print(image['image_id'])
        indices = knn.kneighbors(image['features'], return_distance=False)
        similar_images=[]
        for i in range(indices[0].size):
            similar_images.append(all_image_features[indices[0][i]]['image_id'])
        ALL_SIMILAR_IMAGES[image['image_id']]=similar_images
    with open('data.txt', 'w') as outfile:
        json.dump(ALL_SIMILAR_IMAGES, outfile)

def find_similar_by_text(text):
    text_tokenized = clip.tokenize([text]).to(device)
    with torch.no_grad():
        text_features = model.encode_text(text_tokenized)
        text_features /= text_features.norm(dim=-1, keepdim=True)
    image_features=pk.load( open("./python/clip_image_features.pkl", "rb"))
    features=[]
    for image in image_features:
        features.append(np.array(image['features']))
    features=np.array(features)
    file_names=listdir(IMAGES_PATH)
    ALL_SIMILAR_IMAGES=[]
    for image in image_features:
        orig_img_id=image['image_id']
        similarity = (image["features"] @ text_features.numpy().T)[0][0]
        ALL_SIMILAR_IMAGES.append({"image_id":image['image_id'],"similarity":similarity})
        # print(image['image_id'])  
    ALL_SIMILAR_IMAGES.sort(key=lambda image: image["similarity"],reverse=True)
    return(list(map(lambda el: el["image_id"],ALL_SIMILAR_IMAGES[:20])))    
app = FastAPI()
@app.get("/")
async def read_root():
    return {"Hello": "World"}

@app.get("/generate_clip_features")
async def generate_clip_features_handler():
    generate_clip_features()
    return {"status":"200"}

@app.get("/calculate_similarities")
async def calculate_similarities_handler():
    calculate_similarities()
    return {"status":"200"}

class Item(BaseModel):
    query: str
@app.post("/find_similar_by_text")
async def find_similar_by_text_handler(item:Item):
    similarities=find_similar_by_text(item.query)
    return similarities
    
if __name__ == '__main__':
    uvicorn.run('clip_web:app', host='127.0.0.1', port=33334, log_level="info")

   