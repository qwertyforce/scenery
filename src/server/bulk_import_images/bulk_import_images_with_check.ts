import fs from 'fs'
import path from 'path'
import image_ops from "../helpers/image_ops"
import config from "../../config/config"
import db_ops from "../helpers/db_ops"
const myArgs:any = {}
for (const arg of process.argv.slice(2)){
    if(arg === "--use_filename_id"){
        myArgs["use_filename_id"]=true
    }
}
const fsPromises = fs.promises;
const PATH_TO_IMAGE_IMPORT = path.join(config.root_path, 'import', 'images')
const IMAGES = fs.readdirSync(PATH_TO_IMAGE_IMPORT)
async function import_images() {
    for (const image_file_name of IMAGES) {
        const img_path = `${PATH_TO_IMAGE_IMPORT}/${image_file_name}`
        const img_buffer = await fsPromises.readFile(img_path)
        const img_id =  myArgs["use_filename_id"]? parseInt(path.parse(img_path).name) : -1
        if (isNaN(img_id)) {
            console.log(`${path.parse(img_path).name} is not a number`)
            break
        }
        const img_exists = await db_ops.image_ops.check_if_image_exists_by_id(img_id)
        if (img_exists){
            console.log(`id: ${img_id} is already in db`)
            break
        }
        const img_data = await image_ops.import_image(img_buffer, [], "", false, img_id)
        console.log(img_data)
        // fsPromises.unlink(img_path)
    }
    process.exit()
}
import_images()
