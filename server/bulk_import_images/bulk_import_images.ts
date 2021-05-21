import fs from 'fs'
import path from 'path'
import image_ops from "../helpers/image_ops"
const fsPromises = fs.promises;
import config from "../../config/config"
const PATH_TO_IMAGE_IMPORT = path.join(config.root_path, 'import_from', 'images')
const IMAGES = fs.readdirSync(PATH_TO_IMAGE_IMPORT)

async function import_images() {

    for (const image_file_name of IMAGES) {
       const img_buffer= await fsPromises.readFile(`${PATH_TO_IMAGE_IMPORT}/${image_file_name}`)
       await image_ops.import_image(img_buffer)
    }
    
    process.exit()

}
import_images()
