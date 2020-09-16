import db_ops from './helpers/db_ops'

async function add_tags() {
    const images = await db_ops.image_ops.get_all_images();
    for (const image of images) {
        await db_ops.image_ops.add_tags_to_image_by_id(image.id, [`width:${image.width}`, `height:${image.height}`])
    }
    process.exit()
}
add_tags()

