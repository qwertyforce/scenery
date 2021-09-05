import fs from 'fs'
import path from 'path'
import db_ops from "../helpers/db_ops"
import config from "../../config/config"
const fsPromises = fs.promises;

async function import_tags() {
    const img_tags=JSON.parse(await fsPromises.readFile(path.join(config.root_path,"ambience","id_tags.txt"),'utf8'))
    for (const img of img_tags) {
       await db_ops.image_ops.add_tags_to_image_by_id(img.id,img.tags)
    }
    process.exit()
}
import_tags()
