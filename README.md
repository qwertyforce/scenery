# scenery
a photo gallery with advanced search capabilities <br>
https://scenery.cx <br>
Consists of [scenery](https://github.com/qwertyforce/scenery/) (photo gallery engine) and [ambience](https://github.com/qwertyforce/ambience/) (Reverse image search/similarity search engine) <br>

## scenery
Node.js + MongoDB + TypeScript + Next.js + Express + Material UI <br>

## ambience
Node.js + TypeScript (api gateway) <br>
Python + SQLite + FastAPI + OpenCV + CLIP <br>
hnswlib + faiss<br>

## features <br>
- Search by tags (supports logical expressions) (https://onlycomfy.art/search_syntax) ([logical expression parser](https://github.com/qwertyforce/ambience/))
- Semantic text search (using [CLIP](https://github.com/openai/CLIP)) (https://onlycomfy.art/search_syntax) <br>
- You can find images with similar tags. <br>
- You can find images with similar color palette. <br>
- You can find visually/semantically similar images ([CLIP](https://github.com/openai/CLIP)). <br>
- Reverse image search (phash/AKAZE) <br>
- Image anti-duplication mechanism (phash/AKAZE) <br>
