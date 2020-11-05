/* eslint-disable @typescript-eslint/no-var-requires */
import * as cv from 'opencv4nodejs'
import { HistAxes } from 'opencv4nodejs';
import db_ops from './db_ops';

const detector=new cv.ORBDetector()
const matchFunc=cv.matchBruteForceHammingAsync
const imghash = require('imghash');

const BIN_SIZE=16
const histAxes:HistAxes[]= [
    new HistAxes({
        channel:0,
        bins: BIN_SIZE,
        ranges: [0, 255]
      }),
      new HistAxes({
        channel:1,
        bins: BIN_SIZE,
        ranges: [0, 255]
      }),
      new HistAxes({
        channel:2,
        bins: BIN_SIZE,
        ranges: [0, 255]
      }),
  ]

  async function calculate_color_hist_and_similarities(new_image_id:number,image:Buffer){
        const img_mat = await cv.imdecodeAsync(image)
        let rgb_hist = await cv.calcHistAsync(img_mat, histAxes)
        rgb_hist = rgb_hist.convertTo(cv.CV_32F);
        rgb_hist=rgb_hist.flattenFloat(BIN_SIZE*BIN_SIZE*BIN_SIZE,1)
        rgb_hist = rgb_hist.div(img_mat.sizes[0]*img_mat.sizes[1])
        const arr=rgb_hist.getDataAsArray()    
        db_ops.image_search.add_color_hist_by_id(new_image_id,arr)
        const similarities=[]
        const ids=(await db_ops.image_search.get_image_ids_from_color_similarities()).map((el)=>el.id)
        for(const _id of ids){
            const _image = (await db_ops.image_search.get_color_hist_by_id(_id))[0]
            const color_hist_mat = new cv.Mat(_image.color_hist, cv.CV_32F);
            const similarity = await rgb_hist.compareHistAsync(color_hist_mat, cv.HISTCMP_INTERSECT)
            color_hist_mat.release()
            similarities.push({id:_id,similarity:similarity})
            db_ops.image_search.add_color_similarity_to_other_image(_id,{id:new_image_id,similarity:similarity})
        }
        await db_ops.image_search.add_color_similarities_by_id(new_image_id,similarities)
}
async function get_similar_images_by_orb(image:Buffer) {
  const img_mat = await cv.imdecodeAsync(image)
  const keyPoints = await detector.detectAsync(img_mat);
  const img_descriptors = await detector.computeAsync(img_mat, keyPoints);
  const number_of_images = await db_ops.image_search.get_number_of_images_orb_reverse_search()
  const batch = 500;
  const similar_images=[]
  console.time()
  for (let i = 0; i < number_of_images; i += batch) {
    const descriptors = await db_ops.image_search.get_orb_features_batch(i, batch) 
    for (const img of descriptors) {
      const descriptors2 = new cv.Mat(img.orb_features, cv.CV_8UC1)
      const matches = await matchFunc(img_descriptors, descriptors2);
      descriptors2.release()
      let sum = 0
      for (const x of matches) {
        sum += x.distance
      }
      if (sum===0){
        return [img.id]
      }
      similar_images.push({id:img.id,avg_distance:sum / matches.length})
    }
  }
  console.timeEnd()
  similar_images.sort((a,b)=>a.avg_distance-b.avg_distance)
  similar_images.length=30
  const ids=similar_images.map((el)=>el.id)
  return ids
}
function hamming_distance(str1: string, str2: string) {
  let distance = 0;
  for (let i = 0; i < str1.length; i += 1) {
      if (str1[i] !== str2[i]) {
          distance += 1;
      }
  }
  return distance;
}

async function get_similar_images_by_phash(image:Buffer){
  const phash= await imghash.hash(image,16)
  const images=await db_ops.image_ops.get_ids_and_phashes()
  for(let i=0;i<images.length;i++){
      images[i].dist=hamming_distance(phash,images[i].phash)
      if(images[i].dist===0){
        return [images[i].id]
      }
  }
  images.sort((a,b)=>a.dist-b.dist)
  images.length=30
  const ids=images.map((el)=>el.id)
  return ids
}
export default {calculate_color_hist_and_similarities,get_similar_images_by_orb,get_similar_images_by_phash}