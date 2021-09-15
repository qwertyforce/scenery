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
PUBLIC_IMAGE_PATH="./../../../public/images"

if TAG_ONLY_IMPORT and path.exists("./../../import_file_name_to_scenery_img_data.txt"):
    IMAGE_PATH=PUBLIC_IMAGE_PATH
    with open("./../../import_file_name_to_scenery_img_data.txt", encoding="utf-8") as jsonFile:
        import_file_name_to_scenery_img_data = json.load(jsonFile)
        scenery_img_data=list(import_file_name_to_scenery_img_data.values())

    for img_data in tqdm(scenery_img_data):
        all_tags=tag(f"{IMAGE_PATH}/{img_data['new_file_name']}")
        ID_TAGS_ARR.append({"id":img_data["image_id"],"tags":all_tags})
else:
    IMAGE_PATH=PUBLIC_IMAGE_PATH
    file_names=listdir(IMAGE_PATH)
    for file_name in tqdm(file_names):
        file_id=int(file_name[:file_name.index('.')])
        all_tags=tag(f"{IMAGE_PATH}/{file_name}")
        ID_TAGS_ARR.append({"id":file_id,"tags":all_tags})

with open('./../../id_tags.txt', 'w') as outfile:
    json.dump(ID_TAGS_ARR, outfile,ensure_ascii=False)