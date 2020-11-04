import * as cv from 'opencv4nodejs'
import path from 'path';
import db_ops from '../helpers/db_ops'
import config from '../../config/config'
const detector=new cv.SIFTDetector({ nFeatures: 400 })
const PATH_TO_IMAGES = path.join(config.root_path, 'public', 'images')

async function calculate_color_hist(){
    const images = await db_ops.image_ops.get_all_images()
    for(const image of images){
        const check_if_already_calculated= await db_ops.image_search.get_sift_features_by_id(image.id)
        if(check_if_already_calculated.length!==0){
          continue
        }
        console.log(image.id)
        const img = await cv.imreadAsync(`${PATH_TO_IMAGES}/${image.id}.${image.file_ext}`);
        const keyPoints = await detector.detectAsync(img);
        const descriptors = await detector.computeAsync(img, keyPoints);
        descriptors.release()
        img.release()
        const descriptors_as_array=descriptors.getDataAsArray()
        await db_ops.image_search.add_sift_features_by_id(image.id,descriptors_as_array)
    }
}

async function run() {
  await calculate_color_hist()
}
run()