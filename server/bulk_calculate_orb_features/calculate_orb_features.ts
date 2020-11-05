import * as cv from 'opencv4nodejs'
import path from 'path';
import db_ops from '../helpers/db_ops'
import config from '../../config/config'
const detector=new cv.ORBDetector()
const PATH_TO_IMAGES = path.join(config.root_path, 'public', 'images')

async function calculate_orb_features(){
    const images = await db_ops.image_ops.get_all_images()
    for(const image of images){
        const check_if_already_calculated= await db_ops.image_search.get_orb_features_by_id(image.id)
        if(check_if_already_calculated.length!==0){
          continue
        }
        console.log(image.id)
        try{
          const img = await cv.imreadAsync(`${PATH_TO_IMAGES}/${image.id}.${image.file_ext}`);
          const keyPoints = await detector.detectAsync(img);
          const descriptors = await detector.computeAsync(img, keyPoints);
          const descriptors_as_array=descriptors.getDataAsArray()
          descriptors.release()
          img.release()
          await db_ops.image_search.add_orb_features_by_id(image.id,descriptors_as_array)
        }catch(err){
          console.log(err)
          console.log(image.id)
        }
     
    }
}

async function run() {
  await calculate_orb_features()
  process.exit()
}
run()