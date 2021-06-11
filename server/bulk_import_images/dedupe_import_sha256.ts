import fs from 'fs'
import path from 'path'
import db_ops from "../helpers/db_ops"
import crypto_ops from "../helpers/crypto_ops"
import config from "../../config/config"
const fsPromises = fs.promises;
const PATH_TO_IMAGE_IMPORT = path.join(config.root_path, 'import', 'images')
const IMAGES = fs.readdirSync(PATH_TO_IMAGE_IMPORT)
async function import_images() {
    for (const image_file_name of IMAGES) {
        console.log(image_file_name)
        const img_buffer = await fsPromises.readFile(`${PATH_TO_IMAGE_IMPORT}/${image_file_name}`)
        const sha256_hash = await crypto_ops.image_buffer_sha256_hash(img_buffer)
        const found_img = await db_ops.image_ops.find_image_by_sha256(sha256_hash)
        if (found_img) {
            console.log(`${image_file_name} is a duplicate of img_id = ${found_img.id}. Deleting`)
            await fsPromises.unlink(`${PATH_TO_IMAGE_IMPORT}/${image_file_name}`)
        }
    }
    process.exit()
}
import_images()
