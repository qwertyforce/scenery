import fs from 'fs'
import path from 'path'
import db_ops from "../helpers/db_ops"
import config from "../../config/config"
import cliProgress from "cli-progress"
const fsPromises = fs.promises;
const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)

async function import_source_urls() {
    const img_source_urls = JSON.parse(await fsPromises.readFile(path.join(config.root_path,"import","id_source_url.txt"),'utf8'))
    bar1.start(img_source_urls.length, 0)
    for (const img of img_source_urls) {
       await db_ops.image_ops.set_source_url_to_image_by_id(img.id,img.source_url)
       bar1.increment()
    }
    process.exit()
}
import_source_urls()
