import cv2
import numpy as np
from PIL import Image
from os import listdir
import pickle as pk
import math
sift = cv2.SIFT_create(nfeatures=500)

def read_img_file(f):
    img = Image.open(f)
    return img
def resize_img_to_array(img):
    height,width=img.size
    if height*width>2000*2000:
        k=math.sqrt(height*width/(2000*2000))
        img=img.resize(
            (round(height/k),round(width/k)), 
            Image.ANTIALIAS
        )
    img_array = np.array(img)
    return img_array

def calculate_descr(f):
    eps=1e-7
    img=read_img_file(f)
    img=resize_img_to_array(img)
    key_points, descriptors = sift.detectAndCompute(img, None)
    descriptors /= (descriptors.sum(axis=1, keepdims=True) + eps) #RootSift
    descriptors = np.sqrt(descriptors)    #RootSift
    return (key_points,descriptors)

path="./../public/images"
file_names=listdir(path)
# descs = []
for f in file_names:
    print(f)
    keyp,descs=calculate_descr(path+"/"+f)
    if descs is None:
        continue
    pk.dump(descs, open(f"./features/{f[:f.index('.')]}","wb"))