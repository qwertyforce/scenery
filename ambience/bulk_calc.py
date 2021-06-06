from os import path,listdir,remove
import subprocess
import imagesize
dir_path = path.dirname(path.realpath(__file__))
print(dir_path)

print("=========DELETING LOW-RES IMAGES=========")
IMAGE_PATH="./../import/images"
file_names=listdir(IMAGE_PATH)
for file_name in file_names:
    img_path=IMAGE_PATH+"/"+file_name
    width, height = imagesize.get(img_path)
    if(width*height<921600):
        print(f'deleted {file_name}')
        remove(img_path)
        
print("=========GENERATING IMPORT PHASHES=========")
subprocess.call(["python3","generate_import_phashes.py"],shell=True,cwd="./modules/phash/")
print("=========TRAIN IVF FOR IMPORT=========")
subprocess.call(["conda", "activate", "my_new_environment","&&","python","train_ivf_import.py"],shell=True,cwd="./modules/phash/")
print("=========PHASH DEDUP=========")
subprocess.call(["conda", "activate", "my_new_environment","&&","python","phash_dedup.py"],shell=True,cwd="./modules/phash/")

print("=========GENERATING AKAZE DESCRIPTORS=========")
subprocess.call(["python3","akaze_bulk_calculate_import.py"],shell=True,cwd="./modules/akaze/")
print("=========AKAZE TRAIN_IVF_import=========")
subprocess.call(["conda", "activate", "my_new_environment","&&","python","train_ivf_import.py"],shell=True,cwd="./modules/akaze/")
print("=========AKAZE DEDUP=========")
subprocess.call(["conda", "activate", "my_new_environment","&&","python","akaze_dedup.py"],shell=True,cwd="./modules/akaze/")

print("=========IMPORTING IMAGES INTO SCENERY=========")
subprocess.call(["node","bulk_import_images_without_check.js"],shell=True,cwd="../dist/server/bulk_import_images/")

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
print("=========GENERATING AKAZE DESCRIPTORS=========")
subprocess.call(["python3","generate_rgb_histograms.py"],shell=True,cwd="./modules/histogram/")

remove("./import_filename_to_img_id.txt")
remove("./modules/phash/trained_import.index")
remove("./modules/phash/import_phashes.db")
remove("./modules/akaze/trained_import.index")
remove("./modules/akaze/import_akaze.db")



