import db_ops from '../helpers/db_ops'

async function delete_orb_feature_by_id() {
//  const color_hist_image_ids=[]
 const similarities_image_ids=[-1]
 for (const id of similarities_image_ids){
   await db_ops.image_search.delete_orb_feature_by_id(id)
 }
 process.exit()
}
delete_orb_feature_by_id()