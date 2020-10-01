/* eslint-disable @typescript-eslint/no-explicit-any */
import path from 'path';
import fs from 'fs'
import fsp from "fs/promises";
import config from "../../config/config"
import db_ops from '../helpers/db_ops'
 
const PATH_TO_PUBLIC_UPSCALED= path.join(config.root_path, 'public', 'upscaled')
const PATH_TO_UPSCALED = path.join(config.root_path,'upscaled')
const PUBLIC_UPSCALED = fs.readdirSync(PATH_TO_PUBLIC_UPSCALED)
const UPSCALED = fs.readdirSync(PATH_TO_UPSCALED)
const { COPYFILE_EXCL } = fs.constants;
 
async function import_upscaled() {
    for (const image_file_name of UPSCALED) {
        const file_name=image_file_name.split('.')                           // image.png.png  (esrgan-ncnn-vulkan)
        if(!PUBLIC_UPSCALED.includes(`${file_name[0]}.png`)){
            console.log(`importing ${image_file_name}`)
            await fsp.copyFile(`${PATH_TO_UPSCALED}/${image_file_name}`, `${PATH_TO_PUBLIC_UPSCALED}/${file_name[0]}.png`, COPYFILE_EXCL)
            await db_ops.image_ops.add_tags_to_image_by_id(parseInt(file_name[0]),['upscaled'])
            }
        }   
        process.exit()
    }
import_upscaled()
