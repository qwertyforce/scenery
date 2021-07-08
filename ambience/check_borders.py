from os import listdir
from PIL import Image
from PIL import Image, ImageChops
from joblib import Parallel, delayed

def trim(im):
    bg = Image.new(im.mode, im.size, im.getpixel((0,0)))
    diff = ImageChops.difference(im, bg)
    diff = ImageChops.add(diff, diff, 2.0, -15)
    bbox = diff.getbbox()
    if bbox:
        if bbox[0]==0 and bbox[1]==0 and bbox[2]==im.size[0] and bbox[3]==im.size[1]:
            return False
        return True
    return False
def check_borders(file_name):
    im = Image.open("./../import/images/"+file_name)
    if trim(im):
        return file_name

files=listdir("./../import/images")
borders=Parallel(n_jobs=-1,verbose=1)(delayed(check_borders)(file_name) for file_name in files)
borders= [i for i in borders if i] #remove None's
print(borders)
print(len(borders))
