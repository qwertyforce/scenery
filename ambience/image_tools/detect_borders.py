from os import listdir
from PIL import Image
from PIL import Image, ImageChops
from joblib import Parallel, delayed
IMG_PATH="./../../import/images/"
def trim(im):
    bg = Image.new(im.mode, im.size, im.getpixel((0,0)))
    diff = ImageChops.difference(im, bg)
    diff = ImageChops.add(diff, diff, 2.0, -25)
    bbox = diff.getbbox()
    if bbox:
        if bbox[0]==0 and bbox[1]==0 and bbox[2]==im.size[0] and bbox[3]==im.size[1]:
            return False
        if bbox[1]!=0:
            bottom_margin=im.size[1]-bbox[3]
            if bottom_margin==0:
                return False
        if bbox[3]!=im.size[1]:
            top_margin=bbox[1]
            if top_margin==0:
                return False
        return True
    return False

def check_borders(file_name):
    im = Image.open(IMG_PATH+file_name)
    if trim(im):
        return file_name

files=listdir(IMG_PATH)
borders=Parallel(n_jobs=-1,verbose=1)(delayed(check_borders)(file_name) for file_name in files)
borders= [i for i in borders if i] #remove None's
print(borders)
print(len(borders))
