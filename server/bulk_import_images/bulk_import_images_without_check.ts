import fs from 'fs'
import path from 'path'
import image_ops from "../helpers/image_ops"
import config from "../../config/config"
const fsPromises = fs.promises;
const PATH_TO_IMAGE_IMPORT = path.join(config.root_path, 'import', 'images')
const IMAGES = fs.readdirSync(PATH_TO_IMAGE_IMPORT)
const file_name_to_img_id:any={}
async function import_images() {
    for (const image_file_name of IMAGES) {
       console.log(image_file_name)
       const img_buffer= await fsPromises.readFile(`${PATH_TO_IMAGE_IMPORT}/${image_file_name}`)
       const img_id = await image_ops.import_image_without_check(img_buffer)
       file_name_to_img_id[image_file_name]=img_id
       await fsPromises.writeFile(path.join(config.root_path,"ambience","import_filename_to_img_id.txt"),JSON.stringify(file_name_to_img_id))
    }
    process.exit()
}
import_images()
