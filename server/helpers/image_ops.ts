/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-var-requires */
import db_ops from './db_ops';
import crypto_ops from './crypto_ops';
import thumbnail_ops from './thumbnail_ops'
import sharp from 'sharp'
import axios from 'axios';
import FormData from 'form-data'
import config from '../../config/config'
import {promises as fs} from 'fs'
import {unlink as fs_unlink_callback} from 'fs'

import FileType from 'file-type'
import path from "path"
const PATH_TO_IMAGES = path.join(process.cwd(), 'public', 'images')

///////////////////////////////////////////////////////////////////////////////////////////////////PHASH
async function calculate_phash_features(image_id: number, image: Buffer) {
  const form = new FormData();
  form.append('image', image, { filename: 'document' }) //hack to make nodejs buffer work with form-data
  form.append('image_id', image_id.toString())
  const status = await axios.post(`${config.phash_microservice_url}/calculate_phash_features`, form.getBuffer(), {
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    headers: {
      ...form.getHeaders()
    }
  })
  return status.data
}

async function phash_get_similar_images_by_image_buffer(image: Buffer) {
  const form = new FormData();
  form.append('image', image, { filename: 'document' }) //hack to make nodejs buffer work with form-data
  try {
    const similar = await axios.post(`${config.phash_microservice_url}/phash_reverse_search`, form.getBuffer(), {
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

async function delete_phash_features_by_id(image_id: number) {
    const status = await axios.post(`${config.phash_microservice_url}/delete_phash_features`, { image_id: image_id })
    return status.data
}

///////////////////////////////////////////////////////////////////////////////////////////////////SIFT
async function calculate_sift_features(image_id: number, image: Buffer) {
  const form = new FormData();
  form.append('image', image,{ filename: 'document' }) //hack to make nodejs buffer work with form-data
  form.append('image_id', image_id.toString())
  const status = await axios.post(`${config.sift_microservice_url}/calculate_sift_features`, form.getBuffer(), {
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    headers: {
      ...form.getHeaders()
    }
  })
  return status.data
}
async function sift_get_similar_images_by_image_buffer(image: Buffer) {
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
    const status = await axios.post(`${config.sift_microservice_url}/delete_sift_features`, { image_id: image_id.toString() })
    return status.data
}
///////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////////////////////NN(CLIP)
async function calculate_NN_features(image_id: number, image: Buffer) {
  const form = new FormData();
  form.append('image', image, { filename: 'document' }) //hack to make nodejs buffer work with form-data
  form.append('image_id', image_id.toString())
  const status = await axios.post(`${config.nn_microservice_url}/calculate_NN_features`, form.getBuffer(), {
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    headers: {
      ...form.getHeaders()
    }
  })
  return status.data

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
    const status = await axios.post(`${config.nn_microservice_url}/delete_NN_features`, { image_id: image_id })
    return status.data
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
  const status = await axios.post(`${config.hist_microservice_url}/calculate_HIST_features`, form.getBuffer(), {
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    headers: {
      ...form.getHeaders()
    }
  })
  return status.data
}

async function delete_HIST_features_by_id(image_id: number) {
    const status = await axios.post(`${config.hist_microservice_url}/delete_HIST_features`, { image_id: image_id })
    return status.data
}
///////////////////////////////////////////////////////////////////////////////////////////////////

async function calculate_image_features(image_id: number, image_buffer: Buffer) {
  return Promise.allSettled([
    calculate_sift_features(image_id, image_buffer),
    calculate_NN_features(image_id, image_buffer),
    calculate_HIST_features(image_id, image_buffer),
    calculate_phash_features(image_id, image_buffer),
  ])
}

async function delete_image_features(image_id: number){
  return Promise.allSettled([
    delete_sift_features_by_id(image_id),
    delete_NN_features_by_id(image_id),
    delete_HIST_features_by_id(image_id),
    delete_phash_features_by_id(image_id)
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

async function parse_author(tags: string[]) {
  for (const tag of tags) {
      const idx = tag.indexOf("artist:")
      if (idx === 0) {    //tag starts with "artist:" 
          return tag.slice(7) //strip off "artist:" 
      }
  }
  return "???"
}

async function import_image(image_buffer: Buffer, tags: string[] = [], source_url = "") {
  const sha256_hash = await crypto_ops.image_buffer_sha256_hash(image_buffer)
  const found_img = await db_ops.image_ops.find_image_by_sha256(sha256_hash)
  if (found_img) {
    return `Image with the same sha256 is already in the db. Image id = ${found_img.id} `
  }
  try {
    const mime_type = (await FileType.fromBuffer(image_buffer))?.mime
    let file_ext = ""
    switch (mime_type) {
      case "image/png":
        file_ext = "png"
        break
      case "image/jpeg":
        file_ext = "jpg"
        break
    }
    const metadata = await sharp(image_buffer).metadata()
    const size = metadata.size || 10
    const height = metadata.height || 10
    const width = metadata.width || 10
    const orientation = get_orientation(height, width)
    tags.push(orientation)

    const new_image_id = (await db_ops.image_ops.get_max_image_id()) + 1
    const author = await parse_author(tags)
    await db_ops.image_ops.add_image({ id: new_image_id, description: "", source_url: source_url, file_ext: file_ext, width: width, height: height, author: author, size: size, tags: tags, sha256: sha256_hash })
    await fs.writeFile(`${PATH_TO_IMAGES}/${new_image_id}.${file_ext}`, image_buffer, 'binary')
    await thumbnail_ops.generate_thumbnail(image_buffer, new_image_id)
    const res = await calculate_image_features(new_image_id, image_buffer)
    console.log(`SIFT calc=${res[0].status}`)
    console.log(`NN calc=${res[1].status}`)
    console.log(`HIST calc=${res[2].status}`)
    console.log(`VP calc=${res[3].status}`)
    console.log(`OK. New image_id: ${new_image_id}`)
    return `Success! Image id = ${new_image_id}`
  } catch (error) {
    console.error(error);
  }
}

async function delete_image(id: number) {
  try {
    const image = await db_ops.image_ops.get_image_file_extension_by_id(id)
    if (!image) {
      console.log("image_not_found")
      return "not_found"
    }
    fs_unlink_callback(`${config.root_path}/public/images/${id}.${image.file_ext}`, function (err) {
      if (err) return console.log(err);
      console.log('main image deleted successfully');
    });
    fs_unlink_callback(`${config.root_path}/public/thumbnails/${id}.jpg`, function (err) {
      if (err) return console.log(err);
      console.log('thumbnail file deleted successfully');
    });
    fs_unlink_callback(`${config.root_path}/public/upscaled/${id}.png`, function (err) {
      if (err) return console.log(err);
      console.log('upscaled file deleted successfully');
    });
    const res=await delete_image_features(id)
    console.log(`SIFT del=${res[0].status}`)
    console.log(`NN del=${res[1].status}`)
    console.log(`HIST del=${res[2].status}`)
    console.log(`VP del=${res[3].status}`)
    await db_ops.image_ops.delete_image_by_id(id)
    console.log(`OK. Deleted image_id: ${id}`)
    return true
  } catch (error) {
    console.error(error);
  }
}
export default {
  import_image,
  delete_image,
  get_orientation,
  sift_get_similar_images_by_image_buffer,
  NN_get_similar_images_by_id,
  get_similar_images_by_text,
  phash_get_similar_images_by_image_buffer,
  HIST_get_similar_images_by_id,
  calculate_image_features,
  delete_image_features
}