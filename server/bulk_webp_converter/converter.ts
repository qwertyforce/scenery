import path from 'path';
import fs from 'fs';
import config from "../../config/config"
import thumbnail_ops from "../helpers/thumbnail_ops"
const PATH_TO_IMAGES = path.join(config.root_path, 'public', 'images')
const PATH_TO_WEBP_IMAGES = path.join(config.root_path,'public','webp_images')
const WEBP_IMAGES = fs.readdirSync(PATH_TO_WEBP_IMAGES)
const IMAGES = fs.readdirSync(PATH_TO_IMAGES)

async function convert() {
    for (const image_file_name of IMAGES) {
        if(!WEBP_IMAGES.includes(`${path.parse(image_file_name).name}.webp`)){
            console.log(`converting ${image_file_name}`)
            await thumbnail_ops.generate_thumbnail(`${PATH_TO_IMAGES}/${image_file_name}`,parseInt(path.parse(image_file_name).name))            
        }   
    }
}
convert()
