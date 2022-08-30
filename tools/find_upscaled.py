from os import listdir
import subprocess
from tqdm import tqdm
import re
IMG_PATH="./../../import/images/"
files=listdir(IMG_PATH)
all=[]
for file in tqdm(files):
    file_path=f"{IMG_PATH}/{file}"
    result = subprocess.run(f"resdet {file_path}",shell=True, stdout=subprocess.PIPE)
    res_str=result.stdout.decode("utf-8").splitlines()
    if len(res_str)<2:
        continue
    if "(not upsampled)" in res_str[1]:
        continue
    given_resolution=re.findall(r'\d+', res_str[0])
    given_pixels_total=int(given_resolution[0])*int(given_resolution[1])
    best_guess_resolution=re.findall(r'\d+', res_str[1])
    best_pixels_total=int(best_guess_resolution[0])*int(best_guess_resolution[1])
    if best_pixels_total/given_pixels_total<0.6:
        all.append(file_path)
print(all)
print(len(all))
