/* eslint-disable @typescript-eslint/no-explicit-any */
import path from 'path';
import db_ops from '../helpers/db_ops'
import image_ops from '../helpers/image_ops'
import config from '../../config/config'
import { promises as fs } from "fs";
import sharp from 'sharp'
const PATH_TO_IMAGES = path.join(config.root_path, 'public', 'images')

async function calculate_sift_features(){
    const images = await db_ops.image_ops.get_all_images()
    for(const image of images){
        console.log(image.id)
        try{
          let data = await fs.readFile(`${PATH_TO_IMAGES}/${image.id}.${image.file_ext}`);
          if(image.height*image.width>2000*2000){
            const k=Math.sqrt(image.height*image.width/(2000*2000))
            data = await sharp(data).resize({height:Math.round(image.height/k),width:Math.round(image.width/k)}).toBuffer()
          }
          await image_ops.calculate_sift_features(image.id,data)
        }catch(err){
          console.log(err)
          console.log(image.id)
        }
     
    }
}

async function run() {
  await calculate_sift_features()
  process.exit()
}
run()