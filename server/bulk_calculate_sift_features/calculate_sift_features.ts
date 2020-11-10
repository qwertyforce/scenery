/* eslint-disable @typescript-eslint/no-explicit-any */
import * as cv from 'opencv4nodejs'
import path from 'path';
import db_ops from '../helpers/db_ops'
import config from '../../config/config'
import { promises as fs } from "fs";
import sharp from 'sharp'

const detector=new cv.SIFTDetector({nFeatures:500})
const PATH_TO_IMAGES = path.join(config.root_path, 'public', 'images')

function normalize(descriptor:any){
  for(let i=0;i<descriptor.length;i++){
    const arr=descriptor[i]
    const arr2=[]
    let sum=10**(-7)
    for (const x of arr){
      sum+=x
    }
    for (const x of arr){
      arr2.push(Math.sqrt((x/sum)))
    }
    descriptor[i]=arr2
  }
  return descriptor
}



async function calculate_sift_features(){
    const images = await db_ops.image_ops.get_all_images()
    for(const image of images){
        const check_if_already_calculated= await db_ops.image_search.get_sift_features_by_id(image.id)
        if(check_if_already_calculated.length!==0){
          continue
        }
        console.log(image.id)
        try{
          let data = await fs.readFile(`${PATH_TO_IMAGES}/${image.id}.${image.file_ext}`);
          if(image.height*image.width>2000*2000){
            const k=Math.sqrt(image.height*image.width/(2000*2000))
            data = await sharp(data).resize({height:Math.round(image.height/k),width:Math.round(image.width/k)}).toBuffer()
          }
          const img = await cv.imdecodeAsync(data);
          const keyPoints = await detector.detectAsync(img);
          const descriptors = await detector.computeAsync(img, keyPoints);
          const desc1_normalized=normalize(descriptors.getDataAsArray())
          descriptors.release()
          img.release()
          await db_ops.image_search.add_sift_features_by_id(image.id,desc1_normalized)
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