# scenery
a photo gallery with advanced search capabilities <br>
https://scenery.cx <br>
Consists of [scenery](https://github.com/qwertyforce/scenery/) (photo gallery engine) and [ambience](https://github.com/qwertyforce/ambience/) (Reverse image search/similarity search engine) <br>

How it works: [how_it_works_scenery.md](https://github.com/qwertyforce/scenery/blob/master/how_it_works_scenery.md)
```python 
#OLD: How it works: https://habr.com/ru/post/578254/ [RU]
```
## Current stack:
- Node.js + TypeScript
- [ambience](https://github.com/qwertyforce/ambience)
- Fastify
- MongoDB
- Next.js
- MUI
- sharp

## features <br>

- Search by tags (supports logical expressions, https://scenery.cx/search_syntax)
- Semantic text search  
- You can find images with similar tags, color pallete or visuals/semantics <br>
- Reverse image search <br>
- Image anti-duplication mechanism <br>
- Automatic tagging and captioning
- IPFS support (using [additional microservice](https://github.com/qwertyforce/crud_file_server))
