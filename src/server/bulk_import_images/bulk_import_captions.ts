import fs from 'fs'
import path from 'path'
import db_ops from "../helpers/db_ops"
import config from "../../config/config"
import cliProgress from "cli-progress"
const fsPromises = fs.promises
const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)

async function import_tags() {
    const img_captions=JSON.parse(await fsPromises.readFile(path.join(config.root_path,"import","id_caption.txt"),'utf8'))
    bar1.start(img_captions.length, 0)
    for (const img of img_captions) {
       await db_ops.image_ops.set_caption_to_image_by_id(img.id,img.caption)
       bar1.increment()
    }
    process.exit()
}
import_tags()
