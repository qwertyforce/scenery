from os import listdir
from joblib import Parallel, delayed
import math
import cv2
IMAGE_PATH="./../../import/images"
import easyocr
reader = easyocr.Reader(['en']) 

def resize_img_to_threshold(img):
    height,width=img.shape
    threshold=2000*1500
    if height*width>threshold:
        k=math.sqrt(height*width/(threshold))
        img=cv2.resize(img, (round(width/k),round(height/k)), interpolation=cv2.INTER_LINEAR)
    return img

def check(file_name):
    path=IMAGE_PATH+"/"+file_name
    img=resize_img_to_threshold(cv2.imread(path,0))
    result = reader.readtext(img)
    result = [a for a in result if a[2]>0.3]
    if len(result)>0:
        print(path)
        print(result)

files=listdir(IMAGE_PATH)
borders=Parallel(n_jobs=-1, verbose=1, backend="threading")(delayed(check)(file_name) for file_name in files)

    