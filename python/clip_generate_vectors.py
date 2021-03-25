import os
import torch
import clip
from os import listdir
from os.path import splitext
import json
from PIL import Image
import pickle as pk

device = "cuda" if torch.cuda.is_available() else "cpu"
model, preprocess = clip.load("ViT-B/32")
IMAGES_PATH="../public/images"

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
       all_image_features=pk.load(open("clip_image_features.pkl", "rb"))
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
        print(image_filename)
        # print(image_features)
        all_image_features.append({'image_id':image_id,'features':image_features})
    pk.dump(all_image_features, open("clip_image_features.pkl","wb"))
generate_clip_features()