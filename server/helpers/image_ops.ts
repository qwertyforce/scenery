/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-var-requires */
import * as cv from 'opencv4nodejs'
import { HistAxes } from 'opencv4nodejs';
import db_ops from './db_ops';
import sharp from 'sharp'
import  { bmvbhash } from 'blockhash-core'

const detector=new cv.SIFTDetector({nFeatures:500})
const matchFunc = cv.matchKnnBruteForceAsync

const BIN_SIZE = 16
const histAxes: HistAxes[] = [
  new HistAxes({
    channel: 0,
    bins: BIN_SIZE,
    ranges: [0, 255]
  }),
  new HistAxes({
    channel: 1,
    bins: BIN_SIZE,
    ranges: [0, 255]
  }),
  new HistAxes({
    channel: 2,
    bins: BIN_SIZE,
    ranges: [0, 255]
  }),
]

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
async function get_phash(image:Buffer|string){
  const { data, info } = await sharp(image).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const imageData = {
        width: info.width,
        height: info.height,
        data: data
    };
    const x=bmvbhash(imageData,16)
    return x
}
async function calculate_color_hist_and_similarities(new_image_id: number, image: Buffer) {
  let img_mat = await cv.imdecodeAsync(image)
  if(img_mat.channels===1){
    img_mat=img_mat.cvtColor(cv.COLOR_GRAY2BGR)
   }
  let rgb_hist = await cv.calcHistAsync(img_mat, histAxes)
  rgb_hist = rgb_hist.convertTo(cv.CV_32F);
  rgb_hist = rgb_hist.flattenFloat(BIN_SIZE * BIN_SIZE * BIN_SIZE, 1)
  rgb_hist = rgb_hist.div(img_mat.sizes[0] * img_mat.sizes[1])
  const arr = rgb_hist.getDataAsArray()
  db_ops.image_search.add_color_hist_by_id(new_image_id, arr)
  const similarities = []
  const ids = (await db_ops.image_search.get_image_ids_from_color_similarities()).map((el) => el.id)
  for (const _id of ids) {
    const _image = (await db_ops.image_search.get_color_hist_by_id(_id))[0]
    const color_hist_mat = new cv.Mat(_image.color_hist, cv.CV_32F);
    const similarity = await rgb_hist.compareHistAsync(color_hist_mat, cv.HISTCMP_INTERSECT)
    color_hist_mat.release()
    similarities.push({ id: _id, similarity: similarity })
    db_ops.image_search.add_color_similarity_to_other_image(_id, { id: new_image_id, similarity: similarity })
  }
  await db_ops.image_search.add_color_similarities_by_id(new_image_id, similarities)
}
async function calculate_sift_features(image_id:number,image: Buffer) {
  const metadata = await sharp(image).metadata()
  if(metadata && metadata.height && metadata.width){
    if(metadata.height*metadata.width>2000*2000){
      const k=Math.sqrt(metadata.height*metadata.width/(2000*2000))
      image = await sharp(image).resize({height:Math.round(metadata.height/k),width:Math.round(metadata.width/k)}).toBuffer()
    }
  }
  const img=await cv.imdecodeAsync(image)
  const keyPoints = await detector.detectAsync(img);
  const descriptors = await detector.computeAsync(img, keyPoints);
  const desc1_normalized=normalize(descriptors.getDataAsArray())
  descriptors.release()
  img.release()
  await db_ops.image_search.add_sift_features_by_id(image_id,desc1_normalized)
}
async function get_similar_images_by_sift(image: Buffer) {
  const metadata = await sharp(image).metadata()
  if(metadata && metadata.height && metadata.width){
    if(metadata.height*metadata.width>2000*2000){
      const k=Math.sqrt(metadata.height*metadata.width/(2000*2000))
      image = await sharp(image).resize({height:Math.round(metadata.height/k),width:Math.round(metadata.width/k)}).toBuffer()
    }
  }
  const img_mat = await cv.imdecodeAsync(image)
  const keyPoints = await detector.detectAsync(img_mat);

  const query_image_desc = await detector.computeAsync(img_mat, keyPoints)
  const query_image_desc_normalized=normalize(query_image_desc.getDataAsArray())
  const query_image_desc_normalized_mat=new cv.Mat(query_image_desc_normalized, cv.CV_32FC1)

  const number_of_images = await db_ops.image_search.get_number_of_images_sift_reverse_search()
  const batch = 500;
  let similar_images = []
  for (let i = 0; i < number_of_images; i += batch) {
    const descriptors = await db_ops.image_search.get_sift_features_batch(i, batch)
    for (const img of descriptors) {
      const descriptors2 = new cv.Mat(img.sift_features, cv.CV_32FC1)
      const matches = await matchFunc(query_image_desc_normalized_mat, descriptors2,2);
      descriptors2.release()
      if(matches.length===0){
        continue
      }
      const good_matches=[]
      let good_matches_sum=0
      for(const [desc1,desc2] of matches){
        if(desc1.distance < 0.75*desc2.distance){
          good_matches.push(desc1)
          good_matches_sum+=desc1.distance
        }
      }
      if(good_matches.length<5){
        continue
      }
      const bestN = 5;
      let topBestNSum=0
      const bestMatches = good_matches.sort(
        (match1, match2) => match1.distance - match2.distance
      ).slice(0, bestN);
      for(const x of bestMatches){
        topBestNSum+=x.distance
      }
      similar_images.push({ id: img.id, avg_distance: -((bestN/topBestNSum)*(good_matches.length/(good_matches_sum)))-(good_matches.length)})
    }
  }
  
  similar_images.sort((a, b) => a.avg_distance - b.avg_distance)
  similar_images=similar_images.slice(0,30)
  console.log(similar_images)
  const ids = similar_images.map((el) => el.id)
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

async function get_similar_images_by_phash(image: Buffer) {
  const phash = await get_phash(image)
  let images = await db_ops.image_ops.get_ids_and_phashes()
  for (let i = 0; i < images.length; i++) {
    images[i].dist = hamming_distance(phash, images[i].phash)
    if (images[i].dist === 0) {
      return [images[i].id]
    }
  }
  images.sort((a, b) => a.dist - b.dist)
  images=images.slice(0,30)
  const ids = images.map((el) => el.id)
  return ids
}
export default { calculate_color_hist_and_similarities, get_similar_images_by_sift, get_similar_images_by_phash, calculate_sift_features,get_phash }