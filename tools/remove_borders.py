from os import listdir
from PIL import Image
from PIL import Image, ImageChops

def trim(im):
    bg = Image.new(im.mode, im.size, im.getpixel((0,0)))
    diff = ImageChops.difference(im, bg)
    diff = ImageChops.add(diff, diff,2,-25)
    bbox = diff.getbbox()
    return im.crop(bbox)

IMG_PATH="./../../import/images"
files=[]
for file in files:
    new_img=trim(f"{IMG_PATH}/{file}")
    new_img.save(f"{file}.jpg", quality=90, subsampling=0)