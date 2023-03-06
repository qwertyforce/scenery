import db_ops from './db_ops';
import crypto_ops from './crypto_ops';
import sharp from 'sharp'
import axios from 'axios';
import FormData from 'form-data'
import config from '../../config/config'
import { promises as fs } from 'fs'
import { unlink as fs_unlink_callback } from 'fs'
import { promisify } from 'util'
import { exec } from 'child_process'
const exec_async = promisify(exec);
import { fromBuffer } from 'file-type'
import path from "path"
const PATH_TO_IMAGES = path.join(config.root_path, 'public', 'images')
const PATH_TO_THUMBNAILS = path.join(config.root_path, 'public', 'thumbnails')
const PATH_TO_TEMP = path.join(config.root_path, 'temp')
const JPEGTRAN_PATH = process.platform === 'win32' ? path.join(config.root_path,"src", "bin", "jpegtran.exe") : "jpegtran"
const OXIPNG_PATH = process.platform === 'win32' ? path.join(config.root_path, "src", "bin", "oxipng.exe") : path.join(config.root_path,"src", "bin", "oxipng")

async function optimize_image(extension: string, image: Buffer) {
  try {
    const random_filename = Math.random().toString(36).substring(7)
    const path_to_tmp = path.join(PATH_TO_TEMP, `${random_filename}.${extension}`)
    await fs.writeFile(path_to_tmp, image, 'binary')
    let command = ""
    switch (extension) {
      case 'jpg':
        command = `${JPEGTRAN_PATH} -copy none -optimize -progressive -outfile ${path_to_tmp} ${path_to_tmp}`
        break
      case 'png':
        command = `${OXIPNG_PATH} --strip safe -i 0 ${path_to_tmp}`
        break
    }
    await exec_async(command)
    const optimized_image = await fs.readFile(path_to_tmp)
    await fs.unlink(path_to_tmp)
    return optimized_image
  } catch (e) {
    console.error(e); // should contain code (exit code) and signal (that caused the termination).
    console.log("IMAGE OPTIMIZATION ERROR")
    return image
  }
}

async function generate_thumbnail(image_src: Buffer | string) {  //buffer or path to the image
  const metadata = await sharp(image_src).metadata()
  if (metadata && metadata.height && metadata.width) {
    const x: { width?: number, height?: number } = {}
    if (metadata.width >= metadata.height) {
      x.width = Math.min(metadata.width, 750)
    } else { //metadata.width < metadata.heigh
      x.height = Math.min(metadata.height, 750)
    }
    const data = await sharp(image_src).resize(x).jpeg({ quality: 80, mozjpeg: true }).toBuffer()
    return data
  } else {
    return null
  }
}

async function reverse_search(image: Buffer,find_duplicate =  false) {
  const form = new FormData()
  if(find_duplicate){
    form.append('find_duplicate', "1")
  }
  form.append('image', image, { filename: 'document' }) //hack to make nodejs buffer work with form-data
  try {
    const res = await axios.post(`${config.ambience_microservice_url}/reverse_search`, form.getBuffer(), {
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      headers: {
        ...form.getHeaders()
      }
    })
    return res.data
  } catch (err) {
    console.log(err)
    return {}
  }
}

async function image_text_features_get_similar_images_by_id(image_id: number) {
  try {
    const res = await axios.post(`${config.ambience_microservice_url}/image_text_features_get_similar_images_by_id`, { image_id: image_id,k:20 })
    return res.data.map((el:any)=>el["image_id"])
  } catch (err) {
    console.log(err)
  }
}

async function image_text_features_get_similar_images_by_text(query: string) {
  try {
    const res = await axios.post(`${config.ambience_microservice_url}/image_text_features_get_similar_images_by_text`, { text: query,k:20 })
    return res.data.map((el:any)=>el["image_id"])
  } catch (err) {
    console.log(err)
  }
}

async function color_get_similar_images_by_id(image_id: number) {
  try {
    const res = await axios.post(`${config.ambience_microservice_url}/color_get_similar_images_by_id`, { image_id: image_id,k:20 })
    return res.data.map((el:any)=>el["image_id"])
  } catch (err) {
    console.log(err)
  }
}

async function calculate_all_image_features(image_id: number, image_buffer: Buffer) {
  const form = new FormData();
  form.append('image', image_buffer, { filename: 'document' }) //hack to make nodejs buffer work with form-data
  form.append('image_id', image_id.toString())
  try {
    const similar = await axios.post(`${config.ambience_microservice_url}/calculate_all_image_features`, form.getBuffer(), {
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

async function get_image_tags(image_buffer: Buffer): Promise<string[]> {
  const form = new FormData();
  form.append('image', image_buffer, { filename: 'document' }) //hack to make nodejs buffer work with form-data
  try {
    const similar = await axios.post(`${config.ambience_microservice_url}/get_image_tags`, form.getBuffer(), {
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

async function get_image_caption(image_buffer: Buffer): Promise<string> {
  const form = new FormData();
  form.append('image', image_buffer, { filename: 'document' }) //hack to make nodejs buffer work with form-data
  try {
    const resp = await axios.post(`${config.ambience_microservice_url}/get_image_caption`, form.getBuffer(), {
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      headers: {
        ...form.getHeaders()
      }
    })
    return resp.data
  } catch (err) {
    console.log(err)
    return ""
  }
}

async function upload_data_to_backup_server(full_paths: string[], file_buffers: Buffer[]) {
  const form = new FormData();
  form.append('full_paths', JSON.stringify(full_paths))
  for (const file_buffer of file_buffers) {
    form.append('images', file_buffer, { filename: 'document' }) //hack to make nodejs buffer work with form-data
  }
  const res = await axios.post(`${config.backup_file_server_url}/upload_files`, form.getBuffer(), {
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    headers: {
      ...form.getHeaders()
    }
  })
  return res.data
}

async function delete_all_image_features(image_id: number) {
  try {
    const res = await axios.post(`${config.ambience_microservice_url}/delete_all_image_features`, { image_id: image_id })
    return res.data
  } catch (err) {
    console.log(err)
  }
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

function parse_author(tags: string[]) { //tags like "artist:shishkin"
  for (const tag of tags) {
    const idx = tag.indexOf("artist:")
    if (idx === 0) {    //tag starts with "artist:" 
      return tag.slice(7) //strip off "artist:" 
    }
  }
  return "???"
}

async function import_image(image_buffer: Buffer, tags: string[] = [], source_url = "", bypass_checks = false, img_id=-1) {
  try {
    const sha256_hash = crypto_ops.image_buffer_sha256_hash(image_buffer)
    const found_img = await db_ops.image_ops.find_image_by_sha256(sha256_hash)
    if (found_img) {
      return `Image with the same sha256 is already in the db. Image id = ${found_img.id} `
    }
    if (!bypass_checks && !tags.includes("bypass_dup_check")) {
      const res = await reverse_search(image_buffer,true)
      if (res["local_features_res"] !== undefined) {
        return `Similar image is already in the db. Image ids = ${JSON.stringify(res["local_features_res"])} `
      }
    }
    const mime_type = (await fromBuffer(image_buffer))?.mime
    let file_ext = ""
    switch (mime_type) {
      case "image/png":
        file_ext = "png"
        break
      case "image/jpeg":
        file_ext = "jpg"
        break
      default:
        return "Not supported mime type"
    }
    let metadata = await sharp(image_buffer).metadata()
    if (metadata.orientation) {  //rotate according to EXIF
      image_buffer = await sharp(image_buffer).rotate().toBuffer()
      metadata = await sharp(image_buffer).metadata()
    }
    const size = metadata.size || 10
    const height = metadata.height || 10
    const width = metadata.width || 10
    const thumbnail_buffer = await generate_thumbnail(image_buffer)
    if (!thumbnail_buffer) {
      return "Can't generate thumbnail"
    }
    const orientation = get_orientation(height, width)
    tags.push(orientation)
    if (config.optimize_images) {
      image_buffer = await optimize_image(file_ext, image_buffer)
    }
    const author = parse_author(tags)
    let generated_tags = []
    let caption = ""
    if(!bypass_checks){
      [generated_tags, caption] = (await Promise.allSettled([get_image_tags(image_buffer), get_image_caption(image_buffer)])).map((promise: any) => promise.value)
      tags.push(...generated_tags)
    }
    
    const new_image_id = img_id === -1 ? (await db_ops.image_ops.get_max_image_id()) + 1 : img_id
    await db_ops.image_ops.add_image({ id: new_image_id, caption, source_url, file_ext, width, height, author, size, tags: [...new Set(tags)], sha256: sha256_hash, created_at: new Date() })
    await fs.writeFile(`${PATH_TO_IMAGES}/${new_image_id}.${file_ext}`, image_buffer, 'binary')
    await fs.writeFile(`${PATH_TO_THUMBNAILS}/${new_image_id}.jpg`, thumbnail_buffer, 'binary')
    if(!bypass_checks){
      const res = await calculate_all_image_features(new_image_id, image_buffer)
      if (!res) {
        return "Can't calculate_all_image_features"
      }
      // console.log(`Akaze calc=${res[0].status}`)
      // console.log(`NN calc=${res[1].status}`)
      // console.log(`HIST calc=${res[2].status}`)
      // console.log(`VP calc=${res[3].status}`)
      if (config.use_backup_file_server) {
        try {
          await upload_data_to_backup_server([`images/${new_image_id}.${file_ext}`, `thumbnails/${new_image_id}.jpg`], [image_buffer, thumbnail_buffer])
          console.log("uploaded to backup server")
        } catch (err) {
          console.log("backup_error")
          console.log(err)
        }
      }
    }
    console.log(`OK. New image_id: ${new_image_id}. bypass_checks = ${bypass_checks}`)
    return `Success! Image id = ${new_image_id}`
  } catch (error) {
    console.error(error);
  }
}

async function delete_image(id: number) {
  try {
    const file_ext = await db_ops.image_ops.get_image_file_extension_by_id(id) // this information is needed to delete image files
    if (!file_ext) {
      console.log("image_not_found")
      return "not_found"
    }
    const res = await delete_all_image_features(id)
    if (!res) {
      return "Can't delete all_image_features"
    }
    // console.log(`Akaze del=${res[0].status}`)
    // console.log(`NN del=${res[1].status}`)
    // console.log(`HIST del=${res[2].status}`)
    // console.log(`VP del=${res[3].status}`)

    console.log(`OK. Deleted image_id: ${id}`)
    db_ops.image_ops.delete_image_by_id(id)
    fs_unlink_callback(`${config.root_path}/public/images/${id}.${file_ext}`, function (err) {
      if (err) return console.log(err);
      console.log('main image deleted successfully');
    });
    fs_unlink_callback(`${config.root_path}/public/thumbnails/${id}.jpg`, function (err) {
      if (err) return console.log(err);
      console.log('thumbnail file deleted successfully');
    });
    // fs_unlink_callback(`${config.root_path}/public/upscaled/${id}.png`, function (err) {
    //   if (err) return console.log(err);
    //   console.log('upscaled file deleted successfully');
    // });

    if (config.use_backup_file_server) {
      try {
        await axios.post(`${config.backup_file_server_url}/delete_files`, {
          full_paths: [
            `images/${id}.${file_ext}`, `thumbnails/${id}.jpg`]
        })
        console.log("deleted from backup server")
      } catch (err) {
        console.log("backup_error")
        console.log(err)
      }
    }

    
    return true
  } catch (error) {
    console.error(error);
  }
}
export default {
  import_image,
  delete_image,
  get_orientation,
  image_text_features_get_similar_images_by_id,
  image_text_features_get_similar_images_by_text,
  reverse_search,
  color_get_similar_images_by_id,
  calculate_all_image_features,
  delete_all_image_features
}