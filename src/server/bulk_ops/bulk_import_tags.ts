import fs from 'fs'
import path from 'path'
import db_ops from "../helpers/db_ops"
import config from "../../config/config"
import cliProgress from "cli-progress"
const fsPromises = fs.promises;
const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)

async function import_tags() {
    const img_tags=JSON.parse(await fsPromises.readFile(path.join(config.root_path,"import","id_tags.txt"),'utf8'))
    bar1.start(img_tags.length, 0)
    for (const img of img_tags) {
       await db_ops.image_ops.add_tags_to_image_by_id(img.id,img.tags)
       bar1.increment()
    }
    process.exit()
}
import_tags()
