from os import path,listdir
import json
from tqdm import tqdm

from os import listdir,getcwd,path,chdir
old_cwd=getcwd()
chdir(path.join(getcwd(),"modules"))
from modules.img_tag_module import tag
chdir(old_cwd)

ID_TAGS_ARR=[]
TAG_ONLY_IMPORT=True
IMPORT_IMAGE_PATH="./../../../import/images"
PUBLIC_IMAGE_PATH="./../../../public/images"

if TAG_ONLY_IMPORT and path.exists("./../../import_filename_to_img_id.txt"):
    IMAGE_PATH=IMPORT_IMAGE_PATH
    with open("./../../import_filename_to_img_id.txt") as jsonFile:
        import_filename_to_img_id = json.load(jsonFile)
        jsonFile.close()
    for file_name in tqdm(import_filename_to_img_id):
        all_tags=tag(f"{IMAGE_PATH}/{file_name}")
        ID_TAGS_ARR.append({"id":import_filename_to_img_id[file_name],"tags":all_tags})
else:
    IMAGE_PATH=PUBLIC_IMAGE_PATH
    file_names=listdir(IMAGE_PATH)
    for file_name in tqdm(file_names):
        file_id=int(file_name[:file_name.index('.')])
        all_tags=tag(f"{IMAGE_PATH}/{file_name}")
        ID_TAGS_ARR.append({"id":file_id,"tags":all_tags})

with open('./../../id_tags.txt', 'w') as outfile:
    json.dump(ID_TAGS_ARR, outfile)