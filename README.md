# scenery
a photo gallery with extended search capabilities <br>
https://scenery.cx <br>
Consists of [scenery](https://github.com/qwertyforce/scenery/) (photo gallery engine) and [ambience](https://github.com/qwertyforce/ambience/) (Reverse image search/similarity search engine) <br>

How it works: [how_it_works_scenery.md](https://github.com/qwertyforce/scenery/blob/master/how_it_works_scenery.md)
```python 
#OLD: How it works: https://habr.com/ru/post/578254/ [RU]
```
## Features <br>

- Search by tags (supports logical expressions, https://scenery.cx/search_syntax)
- Semantic text search (find images by text description)    
- You can find images with similar tags, color pallete or visuals/semantics <br>
- Reverse image search (find images by image)  
- Image anti-duplication mechanism <br>
- Automatic image tagging and captioning
- IPFS support (using [additional microservice](https://github.com/qwertyforce/crud_file_server))
- Automatic image mining ([anti_sus](https://github.com/qwertyforce/anti_sus))

## Current stack:
- Node.js + TypeScript
- [ambience](https://github.com/qwertyforce/ambience)
- Fastify
- MongoDB
- Next.js
- MUI
- sharp

## Installation  
[./installation_guide.md](./installation_guide.md)

## Docs
```npm run build``` -> build everything  
```npm run build_pages``` -> build next.js pages and some of backend code  
```npm run build_server``` -> build .ts files  
```npm run import_tags``` -> import tags from /import/id_tags.txt  (generated by places365_tagger_web)  
```npm run import_captions``` -> import captions from /import/id_caption.txt   (generated by image_caption_web)  
     
```npm run import_images``` -> import images  
args:  
--path=/path/to/image_folder  -> imports images from the path, if not specified, default path - /import/images/  
--use_filename_id -> parses image id from file (file name must be an unique number > 0), if not specified, uses sequential ids  
--bypass_ambience -> do not perform calculation of tags,captions, ambience features and duplicate check  
