import db_ops from '../helpers/db_ops'

async function delete_color_hists_and_similarities() {
//  const color_hist_image_ids=[]
 const similarities_image_ids=[-1]
 for (const id of similarities_image_ids){
   await db_ops.image_search.delete_id_from_color_similarities(id)
 }
}
delete_color_hists_and_similarities()