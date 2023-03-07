import fs from 'fs'
import path from 'path'
import image_ops from "../helpers/image_ops"
import config from "../../config/config"
import db_ops from "../helpers/db_ops"
import cluster from 'cluster'
import os from 'os'
// import { exit } from 'process'
const myArgs:any = {}
let PATH_TO_IMAGE_IMPORT = path.join(config.root_path, 'import', 'images')


console.log(process.argv.slice(2))
for (const arg of process.argv.slice(2)){
    if(arg === "--use_filename_id"){
        myArgs["use_filename_id"]=true
    }else if (arg.startsWith("--path=")){
        PATH_TO_IMAGE_IMPORT=path.resolve(arg.slice(arg.indexOf("--path=")+7))
        console.log(PATH_TO_IMAGE_IMPORT)
    }else if(arg === "--bypass_ambience"){
        myArgs["bypass_ambience"]=true
    }
}

const fsPromises = fs.promises;

function splitToChunks(array:string[], parts:number) {
    const new_array = [...array]
    const result:any = []
    for (let i = parts; i > 0; i--) {
        const res = new_array.splice(0, Math.ceil(new_array.length / i))
        if (res.length===0){
            break
        }
        result.push(res)
    }
    return result
}



let IMGS_TO_IMPORT:any=[]
if (cluster.isPrimary) {
    const IMAGES = fs.readdirSync(PATH_TO_IMAGE_IMPORT)
    const workers = Math.min(os.cpus().length,IMAGES.length)
    const chunks = splitToChunks(IMAGES,workers)
    console.log("workers: ", workers)
    console.log(chunks)
    for(let i=0;i<workers;i++){
        cluster.fork({worker_id:i})
        fs.writeFile(`./${i}.json`, JSON.stringify(chunks[i]), err => {
            if (err) {
              console.error(err);
            }
            // file written successfully
          });
    }
    
}else{
    console.log("worker_id: ", process.env.worker_id)
    IMGS_TO_IMPORT = JSON.parse(fs.readFileSync(`./${process.env.worker_id}.json`) as any)
}



async function import_images() {
    for (const image_file_name of IMGS_TO_IMPORT) {
        const img_path = `${PATH_TO_IMAGE_IMPORT}/${image_file_name}`
        const img_buffer = await fsPromises.readFile(img_path)
        const img_id =  myArgs["use_filename_id"] ? parseInt(path.parse(img_path).name) : -1
        if (isNaN(img_id)) {
            console.log(`${path.parse(img_path).name} is not a number`)
            continue
        }
        const img_exists = await db_ops.image_ops.check_if_image_exists_by_id(img_id)
        if (img_exists){
            console.log(`id: ${img_id} is already in db`)
            continue
        }
        const img_data = await image_ops.import_image(img_buffer, [], "",  myArgs["bypass_ambience"], img_id)
        console.log(img_data)
        // fsPromises.unlink(img_path)
    }
}

if (cluster.isPrimary){
    setInterval(() => undefined, 5000) // prevent master from exiting
}else{
    import_images()
}