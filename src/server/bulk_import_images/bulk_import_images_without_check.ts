import fs from 'fs'
import path from 'path'
import image_ops from "../helpers/image_ops"
import config from "../../config/config"
const fsPromises = fs.promises;
const PATH_TO_IMAGE_IMPORT = path.join(config.root_path, 'import', 'images')
const IMAGES = fs.readdirSync(PATH_TO_IMAGE_IMPORT)
const import_file_name_to_scenery_img_data:any={}
async function import_images() {
    for (const image_file_name of IMAGES) {
       const img_path=`${PATH_TO_IMAGE_IMPORT}/${image_file_name}`
       const img_buffer= await fsPromises.readFile(img_path)
       const img_data = await image_ops.import_image_without_check(img_buffer)
       fsPromises.unlink(img_path)
       import_file_name_to_scenery_img_data[image_file_name]=img_data
    }
    await fsPromises.writeFile(path.join(config.root_path,"ambience","import_file_name_to_scenery_img_data.txt"),JSON.stringify(import_file_name_to_scenery_img_data))
    process.exit()
}
import_images()
