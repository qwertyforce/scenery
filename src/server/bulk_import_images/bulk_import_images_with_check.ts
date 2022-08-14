import fs from 'fs'
import path from 'path'
import image_ops from "../helpers/image_ops"
import sharp from "sharp"
import config from "../../config/config"
const fsPromises = fs.promises;
const PATH_TO_IMAGE_IMPORT = path.join(config.root_path, 'import', 'images')
const IMAGES = fs.readdirSync(PATH_TO_IMAGE_IMPORT)

async function import_images() {

    for (const image_file_name of IMAGES) {
       const img_buffer= await fsPromises.readFile(`${PATH_TO_IMAGE_IMPORT}/${image_file_name}`)
       const metadata = await sharp(img_buffer).metadata()
       const height = metadata.height || 10
       const width = metadata.width || 10
       if(height*width<921600){
           console.log(`${image_file_name} is low_res. Skipping.`)
       }
       await image_ops.import_image(img_buffer)
    }
    process.exit()
}
import_images()
