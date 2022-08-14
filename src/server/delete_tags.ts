import db_ops from './helpers/db_ops'

async function delete_tags() {
    const tags_to_delete=["height:","width:"]
    const images = await db_ops.image_ops.get_all_images();
    for (const image of images) {
            const tags= image.tags.filter((el:string)=>!tags_to_delete.some((tag)=>el.includes(tag)))
            await db_ops.image_ops.update_image_data_by_id(image.id, {tags:tags})
        }
}
async function run(){
    await delete_tags()
    process.exit()
}
run()


