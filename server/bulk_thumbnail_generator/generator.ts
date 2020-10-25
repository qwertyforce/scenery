import path from 'path';
import fs from 'fs';
import config from "../../config/config"
import thumbnail_ops from "../helpers/thumbnail_ops"
const PATH_TO_IMAGES = path.join(config.root_path, 'public', 'images')
const PATH_TO_THUMBNAILS = path.join(config.root_path,'public','thumbnails')
const THUMBNAILS = fs.readdirSync(PATH_TO_THUMBNAILS)
const IMAGES = fs.readdirSync(PATH_TO_IMAGES)

async function generate() {
    for (const image_file_name of IMAGES) {
        if(!THUMBNAILS.includes(`${path.parse(image_file_name).name}.jpg`)){
            console.log(`converting ${image_file_name}`)
            await thumbnail_ops.generate_thumbnail(`${PATH_TO_IMAGES}/${image_file_name}`,parseInt(path.parse(image_file_name).name))            
        }   
    }
}
generate()
