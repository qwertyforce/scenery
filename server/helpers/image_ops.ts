import * as cv from 'opencv4nodejs'
import { HistAxes } from 'opencv4nodejs';
import db_ops from './db_ops';
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
        const ids=(await db_ops.image_search.get_image_ids_from_color_similarities()).map((el)=>el.id)
        for(const _id of ids){
            const _image = (await db_ops.image_search.get_color_hist_by_id(_id))[0]
            const color_hist_mat = new cv.Mat(_image.color_hist, cv.CV_32F);
            const similarity = await rgb_hist.compareHistAsync(color_hist_mat, cv.HISTCMP_INTERSECT)
            color_hist_mat.release()
            db_ops.image_search.add_color_similarity_to_other_image(_id,{id:new_image_id,similarity:similarity})
        }
        await db_ops.image_search.add_color_similarities_by_id(new_image_id,[])
}
export default {calculate_color_hist_and_similarities}