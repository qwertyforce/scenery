import * as cv from 'opencv4nodejs'
import { HistAxes } from 'opencv4nodejs';
import path from 'path';
import db_ops from '../helpers/db_ops'
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
const PATH_TO_IMAGES = path.join("..", "..", "..", 'public', 'images')

async function calculate_color_hist(){
    const images = await db_ops.image_ops.get_all_images()
    for(const image of images){
        console.log(image.id)
        const img = await cv.imreadAsync(`${PATH_TO_IMAGES}/${image.id}.${image.file_ext}`);
        let rgb_hist = await cv.calcHistAsync(img, histAxes)
        rgb_hist = rgb_hist.convertTo(cv.CV_32F);
        rgb_hist=rgb_hist.flattenFloat(BIN_SIZE*BIN_SIZE*BIN_SIZE,1)
        rgb_hist = rgb_hist.div(img.sizes[0]*img.sizes[1])
        const arr=rgb_hist.getDataAsArray()          
        await db_ops.image_search.add_color_hist_by_id(image.id,arr)
    }
    process.exit()
}

async function calc_similarities() {
  const images = await db_ops.image_ops.get_all_images() 
  const get_all_hist=await db_ops.image_search.get_all_color_hists()
  console.time();
  for (let i = 0; i < images.length - 1; i++) {
    const target_image = get_all_hist.find((el)=>el.id===images[i].id)
    const target_hist = new cv.Mat(target_image.color_hist, cv.CV_32F)
    const similarities=[]
    for (let j = i + 1; j < images.length; j++) {
      const _image = get_all_hist.find((el)=>el.id===images[j].id)
      const color_hist_mat = new cv.Mat(_image.color_hist, cv.CV_32F);
      const similarity = await target_hist.compareHistAsync(color_hist_mat, cv.HISTCMP_INTERSECT)
      similarities.push({id:images[j].id,similarity:similarity})
      color_hist_mat.release()
      console.log(`${i}->${j}`)
    }
    await db_ops.image_search.add_color_similarities_by_id(images[i].id,similarities)
  }
  console.timeEnd()
  process.exit()
}
async function calc_color_hists_and_similarities() {
  await calculate_color_hist()
  await calc_similarities()
}
calc_color_hists_and_similarities()