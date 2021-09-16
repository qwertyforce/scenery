from os import path,listdir,remove
import subprocess
import imagesize
from tqdm import tqdm
AKAZE_MANUAL_DEDUP=False
dir_path = path.dirname(path.realpath(__file__))
print(dir_path)

def clean_up():
    print("=========CLEANING UP=========")
    if path.exists("./import_file_name_to_scenery_img_data.txt"): remove("./import_file_name_to_scenery_img_data.txt")
    if path.exists("./modules/phash/trained_import.index"): remove("./modules/phash/trained_import.index")
    if path.exists("./modules/phash/import_phashes.db"): remove("./modules/phash/import_phashes.db")
    if path.exists("./modules/akaze/import_akaze.db"): remove("./modules/akaze/import_akaze.db")
    if path.exists("./modules/akaze/trained_import.index"): remove("./modules/akaze/trained_import.index")

clean_up()    
print("=========DELETING LOW-RES IMAGES=========")
IMAGE_PATH="./../import/images"
file_names=listdir(IMAGE_PATH)
for file_name in tqdm(file_names):
    img_path=IMAGE_PATH+"/"+file_name
    width, height = imagesize.get(img_path)
    if(width*height<1024*1024):
        print(f'deleted {file_name}')
        remove(img_path)


print("=========AUTOROTATE JPEG (EXIF)=========")
subprocess.call("exiftran -ai *.jpg",shell=True,cwd="../import/images/")
subprocess.call("exiftran -ai *.jpeg",shell=True,cwd="../import/images/")


print("=========DEDUP SHA256=========")
subprocess.call(["node","dedupe_import_sha256.js"],shell=True,cwd="../dist/server/bulk_import_images/")

print("=========GENERATING IMPORT PHASHES=========")
subprocess.call(["python3","generate_import_phashes.py"],shell=True,cwd="./modules/phash/")
print("=========TRAIN IVF FOR IMPORT=========")
subprocess.call(["conda", "activate", "my_new_environment","&&","python","train_ivf_import.py"],shell=True,cwd="./modules/phash/")
print("=========PHASH DEDUP INTERNAL=========")
subprocess.call(["conda", "activate", "my_new_environment","&&","python","phash_dedup_internal.py"],shell=True,cwd="./modules/phash/")
print("=========PHASH DEDUP=========")
subprocess.call(["conda", "activate", "my_new_environment","&&","python","phash_dedup.py"],shell=True,cwd="./modules/phash/")

print("=========GENERATING AKAZE DESCRIPTORS=========")
subprocess.call(["python3","akaze_bulk_calculate_import.py"],shell=True,cwd="./modules/akaze/")
print("=========AKAZE TRAIN_IVF_import=========")
subprocess.call(["conda", "activate", "my_new_environment","&&","python","train_ivf_import.py"],shell=True,cwd="./modules/akaze/")

if AKAZE_MANUAL_DEDUP:
    print("=========AKAZE DEDUP=========")
    subprocess.call(["conda", "activate", "my_new_environment","&&","python","akaze_dedup.py"],shell=True,cwd="./modules/akaze/")
    print("press enter to conitnue")
    input()
else:
    print("=========SKIPPING AKAZE DEDUP=========")

print("=========IMPORTING IMAGES INTO SCENERY=========")
subprocess.call(["node","bulk_import_images_without_check.js"],shell=True,cwd="../dist/server/bulk_import_images/")

print("=========AUTO TAGGING IMAGES=========")
subprocess.call(["python3","resnet_image_tagging.py"],shell=True,cwd="./modules/nn/")
print("=========IMPORTING TAGS INTO SCENERY=========")
subprocess.call(["node","bulk_import_tags.js"],shell=True,cwd="../dist/server/bulk_import_images/")

print("=========PHASH IMPORT INTO MAIN DB=========")
subprocess.call(["conda", "activate", "my_new_environment","&&","python","phash_import.py"],shell=True,cwd="./modules/phash/")
print("=========PHASH TRAIN_IVF=========")
subprocess.call(["conda", "activate", "my_new_environment","&&","python","train_ivf.py"],shell=True,cwd="./modules/phash/")

print("=========AKAZE IMPORT INTO MAIN DB=========")
subprocess.call(["conda", "activate", "my_new_environment","&&","python","akaze_import.py"],shell=True,cwd="./modules/akaze/")
print("=========AKAZE TRAIN_IVF=========")
subprocess.call(["conda", "activate", "my_new_environment","&&","python","train_ivf.py"],shell=True,cwd="./modules/akaze/")

print("=========GENERATING NN FEATURES=========")
subprocess.call(["python3","clip_generate_vectors.py"],shell=True,cwd="./modules/nn/")
print("=========GENERATING RGB HISTOGRAMS=========")
subprocess.call(["python3","generate_rgb_histograms.py"],shell=True,cwd="./modules/histogram/")
clean_up()




