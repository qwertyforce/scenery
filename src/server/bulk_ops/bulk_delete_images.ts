import fs from 'fs'
import path from 'path'
import image_ops from "../helpers/image_ops"
import config from "../../config/config"
import cliProgress from "cli-progress"
const fsPromises = fs.promises;
const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)

async function delete_images() {
    const img_ids=JSON.parse(await fsPromises.readFile(path.join(config.root_path,"import","ids_to_delete.txt"),'utf8'))
    bar1.start(img_ids.length, 0)
    for (const img_id of img_ids) {
       await image_ops.delete_image(img_id)
       bar1.increment()
    }
    process.exit()
}
delete_images()
