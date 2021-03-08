import image_ops from '../helpers/image_ops'

async function delete_sift_feature_by_id() {
//  const color_hist_image_ids=[]
 const similarities_image_ids=[-1]
 for (const id of similarities_image_ids){
   await image_ops.delete_sift_feature_by_id(id)
 }
 process.exit()
}
delete_sift_feature_by_id()