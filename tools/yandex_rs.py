import json
from bs4 import BeautifulSoup
import requests
import imagesize
from os import listdir
from tqdm import tqdm
import cv2
import io
import math
import magic

RESIZE_THRESHOLD=3000*3000


def resize_img_to_threshold(img, height, width):
    k = math.sqrt(height*width/(RESIZE_THRESHOLD))
    img = cv2.resize(img, (round(width/k), round(height/k)),interpolation=cv2.INTER_AREA)
    return img


def yandex_reverse_search(filePath=None, image_buffer=None):
    searchUrl = 'https://yandex.ru/images/search'
    if filePath:
        image_buffer = open(filePath, 'rb')

    files = {'upfile': ('blob', image_buffer, 'image/jpeg')}
    params = {'rpt': 'imageview', 'format': 'json','request': '{"blocks":[{"block":"b-page_type_search-by-image__link"}]}'}
    response = requests.post(searchUrl, params=params, files=files)
    query_string = json.loads(response.content)['blocks'][0]['params']['url']
    img_search_url = searchUrl + '?' + query_string
    search_page_text = requests.get(img_search_url).text
    search_page_soup = BeautifulSoup(search_page_text, 'html.parser')
    search_page_dim_div = search_page_soup.find("div", class_="Tags Tags_type_simple Tags_view_buttons")
    if search_page_dim_div:
        links = search_page_dim_div.find_all("a")
        dimensions = links[0].getText().split("×")
        pixels = int(dimensions[0])*int(dimensions[1])
        return (img_search_url, pixels, dimensions)
    return (0, 0, 0)


IMAGE_PATH="./../../import/images"
file_names=listdir(IMAGE_PATH)

for file_name in tqdm(file_names):
    io_buf=None
    img_path = f'{IMAGE_PATH}/{file_name}'
    width, height = imagesize.get(img_path)

    if width*height > RESIZE_THRESHOLD:
        mime_type = magic.from_buffer(open(img_path, "rb").read(2048), mime=True)
        if mime_type == "image/jpeg":
            ext = ".jpg"
        if mime_type == "image/png":
            ext = ".png"
        img = cv2.imread(img_path, cv2.IMREAD_UNCHANGED)
        img = resize_img_to_threshold(img, height, width)
        is_success, buffer = cv2.imencode(ext, img)
        if is_success:
            io_buf = io.BytesIO(buffer)

    try:
        if io_buf:
           img_search_url, pixels, dimensions = yandex_reverse_search(image_buffer=io_buf)
        else:
           img_search_url, pixels, dimensions = yandex_reverse_search(img_path)

    except Exception as e:
        print(e)
        print(f'yandex_reverse_search error. {file_name}')
        continue

    if width*height < pixels:
        print(img_path)
        print(f"original resolution - {width, height}")
        print(f"new resolution {dimensions}")
        print(img_search_url)
