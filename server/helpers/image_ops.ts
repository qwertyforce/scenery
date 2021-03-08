/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-var-requires */
import * as cv from 'opencv4nodejs'
import { HistAxes } from 'opencv4nodejs';
import db_ops from './db_ops';
import sharp from 'sharp'
import { bmvbhash } from 'blockhash-core'
import axios from 'axios';
import FormData from 'form-data'
import config from '../../config/config'
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

async function get_phash(image: Buffer | string) {
  const { data, info } = await sharp(image).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const imageData = {
    width: info.width,
    height: info.height,
    data: data
  };
  const x = bmvbhash(imageData, 16)
  return x
}
async function calculate_color_hist_and_similarities(new_image_id: number, image: Buffer) {
  let img_mat = await cv.imdecodeAsync(image)
  if (img_mat.channels === 1) {
    img_mat = img_mat.cvtColor(cv.COLOR_GRAY2BGR)
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

async function calculate_sift_features(image_id: number, image: Buffer) {
  const form = new FormData();
  form.append('image', image,{ filename: 'document' }) //hack to make nodejs buffer work with form-data
  form.append('image_id', image_id.toString())
  try {
    const status = await axios.post(`${config.python_microservice_url}/calculate_sift_features`, form.getBuffer(), {
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
    const similar = await axios.post(`${config.python_microservice_url}/sift_reverse_search`, form.getBuffer(), {
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
async function delete_sift_feature_by_id(image_id: number) {
  try {
    const status = await axios.post(`${config.python_microservice_url}/delete_sift_features`, { image_id: image_id.toString() })
    return status.data
  } catch (err) {
    console.log(err)
  }
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
  images = images.slice(0, 30)
  const ids = images.map((el) => el.id)
  return ids
}
export default { calculate_color_hist_and_similarities, get_similar_images_by_sift, get_similar_images_by_phash, calculate_sift_features, get_phash, delete_sift_feature_by_id }