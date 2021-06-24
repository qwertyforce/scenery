
import torch
import clip
import sqlite3
import io
import numpy as np
from os import listdir
import json
conn = sqlite3.connect('NN_features.db')
device = "cuda" if torch.cuda.is_available() else "cpu"
model, preprocess = clip.load("ViT-B/32")
IMAGE_PATH="./../../../public/images"
ID_TAGS_ARR=[]
def convert_array(text):
    out = io.BytesIO(text)
    out.seek(0)
    return np.load(out)

def get_all_ids():
    cursor = conn.cursor()
    query = '''SELECT id FROM clip'''
    cursor.execute(query)
    all_rows = cursor.fetchall()
    return list(map(lambda el:el[0],all_rows))

def get_all_data():
    cursor = conn.cursor()
    query = '''
    SELECT id, clip_features
    FROM clip
    '''
    cursor.execute(query)
    all_rows = cursor.fetchall()
    return list(map(lambda el:{"image_id":el[0],"features":convert_array(el[1])},all_rows))

def delete_descriptor_by_id(id):
	cursor = conn.cursor()
	query = '''DELETE FROM clip WHERE id=(?)'''
	cursor.execute(query,(id,))
	conn.commit()

def sync_db():
    ids_in_db=set(get_all_ids())
    file_names=listdir(IMAGE_PATH)
    for file_name in file_names:
        file_id=int(file_name[:file_name.index('.')])
        if file_id in ids_in_db:
            ids_in_db.remove(file_id)
    for id in ids_in_db:
        delete_descriptor_by_id(id)   #Fix this
        print(f"deleting {id}")
    print("db synced")

def tag_images():
    image_data=get_all_data()
    features=[]
    ids=[]
    for image in image_data:
        features.append(image['features'])
        ids.append(image['image_id'])
    features=np.array(features).squeeze()
    tags1=["winter", "summer", "spring", "autumn"]
    tags2 = ["midnight", "noon","morning","afternoon","evening","night","dawn","dusk","sunrise","sunset"]
    tags3=["sea","ocean"]
    for x in tags3[:]:
        tags3.append(f"{x} in the background")
    tags4=["tree","forest"]
    for x in tags4[:]:
        tags4.append(f"{x} in the background")
    tags5=["mountain","mountains"]
    for x in tags5[:]:
        tags5.append(f"{x} in the background")
    # tags6=["cloudy sky","clear sky","uniform sky"]
    tags6=["cumulus",
    "altocumulus",
    "stratocumulus",
    "cumulonimbus",
    "cirrocumulus",
    "stratus",
    "altostratus",
    "nimbostratus",
    "cirrus",
    "cirrostratus",
    ]
    tags7=["outdoors","indoors"]
    tags_single=["fog","desert","cloudy","grass","grass field","beach","moon in the sky","sun in the sky","sunlight","body of water","stones","pathway"]

    tags1_l=len(tags1)
    tags2_l=len(tags2)
    tags3_l=len(tags3)
    tags4_l=len(tags4)
    tags5_l=len(tags5)
    tags6_l=len(tags6)
    tags7_l=len(tags7)
    tags_single_l=len(tags_single)
    
    tags12_l=tags1_l+tags2_l
    tags123_l=tags12_l+tags3_l
    tags1234_l=tags123_l+tags4_l
    tags12345_l=tags1234_l+tags5_l
    tags123456_l=tags12345_l+tags6_l
    tags1234567_l=tags123456_l+tags7_l
    tags1234567s_l=tags1234567_l+tags_single_l

    all_tags=[]
    for tags in [tags1,tags2,tags3,tags4,tags5,tags6,tags7,tags_single]:
        for el in tags:
            # all_tags.append(el)
            all_tags.append(f"a photo of a {el}")

    text = clip.tokenize(all_tags).to(device)
    with torch.no_grad():
        text_features = model.encode_text(text)
        text_features /= text_features.norm(dim=-1, keepdim=True)
        text_features=text_features.cpu().numpy()
        all_similarity = (100* features @ text_features.T)
    print(all_similarity.shape)
    for idx in range(len(ids)):
        similarity=all_similarity[idx]
        tags=[]
        tags1_index_max = max(range(0,tags1_l), key=similarity.__getitem__)
        if similarity[tags1_index_max]>=23:
            tags.append(tags1[tags1_index_max])
        tags2_index_max = max(range(tags1_l,tags2_l), key=similarity.__getitem__)
        if similarity[tags2_index_max]>=23:
            tags.append(tags2[tags2_index_max-tags1_l])
        tags3_index_max = max(range(tags12_l,tags123_l), key=similarity.__getitem__)
        if similarity[tags3_index_max]>=23:
            tags.append(tags3[tags3_index_max-tags12_l])

        tags4_index_max = max(range(tags123_l,tags1234_l), key=similarity.__getitem__)
        if similarity[tags4_index_max]>=23:
            tags.append(tags4[tags4_index_max-tags123_l])

        tags5_index_max = max(range(tags1234_l,tags12345_l), key=similarity.__getitem__)
        if similarity[tags5_index_max]>=23:
            tags.append(tags5[tags5_index_max-tags1234_l])

        tags6_index_max = max(range(tags12345_l,tags123456_l), key=similarity.__getitem__)
        if similarity[tags6_index_max]>=23:
            tags.append(tags6[tags6_index_max-tags12345_l])

        tags7_index_max = max(range(tags123456_l,tags1234567_l), key=similarity.__getitem__)
        if similarity[tags7_index_max]>=23:
            tags.append(tags7[tags7_index_max-tags123456_l])

        for i in range(tags1234567_l,tags1234567s_l):
            if similarity[i]>=23:
                tags.append(tags_single[i-tags1234567_l])
        # print(tags)
        ID_TAGS_ARR.append({"id":ids[idx],"tags":tags})
    with open('./../../id_tags.txt', 'w') as outfile:
        json.dump(ID_TAGS_ARR, outfile)
sync_db()
tag_images()