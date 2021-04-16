/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-var-requires */
import db_ops from './db_ops';
import sharp from 'sharp'
import { bmvbhash } from 'blockhash-core'
import axios from 'axios';
import FormData from 'form-data'
import config from '../../config/config'
const IMAGES_IDS_PHASHES:any={}
const VPTreeFactory: any = require("vptree");
let vptree:any;
build_vp_tree()

function hamming_distance(img1: any[], img2: any[]) {
  let distance = 0;
  const str1=img1[1]
  const str2=img2[1]
  for (let i = 0; i < str1.length; i += 1) {
    if (str1[i] !== str2[i]) {
      distance += 1;
    }
  }
  return distance;
}
async function build_vp_tree(){
  const ids_phashes=await db_ops.image_ops.get_ids_and_phashes()
  for (const img of ids_phashes){
    IMAGES_IDS_PHASHES[img.id]=img.phash
  }
  vptree=VPTreeFactory.build(Object.entries(IMAGES_IDS_PHASHES), hamming_distance)
}

async function add_to_vp_tree(id:number,phash:string){
  IMAGES_IDS_PHASHES[id]=phash
  vptree=VPTreeFactory.build(Object.entries(IMAGES_IDS_PHASHES), hamming_distance)
}

async function remove_from_vp_tree(id:number){
  delete IMAGES_IDS_PHASHES[id]
  vptree=VPTreeFactory.build(Object.entries(IMAGES_IDS_PHASHES), hamming_distance)
}

// async function modify_vp_tree(id:number,phash:string){
//   IMAGES_IDS_PHASHES[id]=phash
//   vptree=VPTreeFactory.build(Object.entries(IMAGES_IDS_PHASHES), hamming_distance)
// }

async function calculate_phash(image: Buffer | string) {
  const { data, info } = await sharp(image).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const imageData = {
    width: info.width,
    height: info.height,
    data: data
  };
  const x = bmvbhash(imageData, 16)
  return x
}

async function get_similar_images_by_phash(image: Buffer) {
  const phash = await calculate_phash(image)
  const nearest=vptree.search([0,phash],30);
  const ids= nearest.map((el:any) => el.data[0])
  return ids
}

///////////////////////////////////////////////////////////////////////////////////////////////////SIFT
async function calculate_sift_features(image_id: number, image: Buffer) {
  const form = new FormData();
  form.append('image', image,{ filename: 'document' }) //hack to make nodejs buffer work with form-data
  form.append('image_id', image_id.toString())
  try {
    const status = await axios.post(`${config.sift_microservice_url}/calculate_sift_features`, form.getBuffer(), {
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      headers: {
        ...form.getHeaders()
      }
    })
    return status.data
  } catch (err) {
    console.log(err)
  }
}
async function get_similar_images_by_sift(image: Buffer) {
  const form = new FormData();
  form.append('image', image, { filename: 'document' }) //hack to make nodejs buffer work with form-data
  try {
    const similar = await axios.post(`${config.sift_microservice_url}/sift_reverse_search`, form.getBuffer(), {
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      headers: {
        ...form.getHeaders()
      }
    })
    return similar.data
  } catch (err) {
    console.log(err)
    return []
  }
}
async function delete_sift_features_by_id(image_id: number) {
  try {
    const status = await axios.post(`${config.sift_microservice_url}/delete_sift_features`, { image_id: image_id.toString() })
    return status.data
  } catch (err) {
    console.log(err)
  }
}
///////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////////////////////NN(CLIP)
async function calculate_NN_features(image_id: number, image: Buffer) {
  const form = new FormData();
  form.append('image', image,{ filename: 'document' }) //hack to make nodejs buffer work with form-data
  form.append('image_id', image_id.toString())
  try {
    const status = await axios.post(`${config.nn_microservice_url}/calculate_NN_features`, form.getBuffer(), {
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      headers: {
        ...form.getHeaders()
      }
    })
    return status.data
  } catch (err) {
    console.log(err)
  }
}

async function NN_get_similar_images_by_id(image_id: number) {
  try {
    const res = await axios.post(`${config.nn_microservice_url}/get_similar_images_by_id`, { image_id: image_id })
    return res.data
  } catch (err) {
    console.log(err)
  }
}

async function delete_NN_features_by_id(image_id: number) {
  try {
    const status = await axios.post(`${config.nn_microservice_url}/delete_NN_features`, { image_id: image_id })
    return status.data
  } catch (err) {
    console.log(err)
  }
}

async function get_similar_images_by_text(query: string) {
  try {
    const res = await axios.post(`${config.nn_microservice_url}/find_similar_by_text`, { query: query })
    return res.data
  } catch (err) {
    console.log(err)
  }
}
///////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////RGB_HISTOGRAM
async function HIST_get_similar_images_by_id(image_id: number) {
  try {
    const res = await axios.post(`${config.hist_microservice_url}/get_similar_images_by_id`, { image_id: image_id })
    return res.data
  } catch (err) {
    console.log(err)
  }
}

async function calculate_HIST_features(image_id: number, image: Buffer) {
  const form = new FormData();
  form.append('image', image,{ filename: 'document' }) //hack to make nodejs buffer work with form-data
  form.append('image_id', image_id.toString())
  try {
    const status = await axios.post(`${config.hist_microservice_url}/calculate_HIST_features`, form.getBuffer(), {
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      headers: {
        ...form.getHeaders()
      }
    })
    return status.data
  } catch (err) {
    console.log(err)
  }
}

async function delete_HIST_features_by_id(image_id: number) {
  try {
    const status = await axios.post(`${config.hist_microservice_url}/delete_HIST_features`, { image_id: image_id })
    return status.data
  } catch (err) {
    console.log(err)
  }
}
///////////////////////////////////////////////////////////////////////////////////////////////////

async function calculate_image_features(image_id: number, image_buffer: Buffer, phash: string) {
  return Promise.all([
    await calculate_sift_features(image_id, image_buffer),
    await calculate_NN_features(image_id, image_buffer),
    await calculate_HIST_features(image_id, image_buffer),
    await add_to_vp_tree(image_id, phash),
  ])
}

async function delete_image_features(image_id: number){
  return Promise.all([
    await delete_sift_features_by_id(image_id),
    await delete_NN_features_by_id(image_id),
    await delete_HIST_features_by_id(image_id),
    await remove_from_vp_tree(image_id)
  ])
}

function get_orientation(height: number, width: number) {
  if (height > width) {
    return "vertical"
  } else if (height < width) {
    return "horizontal"
  } else {
    return "square"
  }
}

export default {
  get_orientation,
  calculate_phash,
  get_similar_images_by_sift,
  NN_get_similar_images_by_id,
  get_similar_images_by_text,
  get_similar_images_by_phash,
  HIST_get_similar_images_by_id,
  calculate_image_features,
  delete_image_features
}