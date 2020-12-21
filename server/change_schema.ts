import db_ops from './helpers/db_ops'

async function change_schema() {
    const images = await db_ops.image_ops.get_all_images();
    for (const image of images) {
        if(image.derpi_id){
            const new_image=JSON.parse(JSON.stringify(image))
            console.log(image.id)
            new_image.booru="derpibooru"
            new_image.booru_id=image.derpi_id
            new_image.booru_likes=image.derpi_likes
            new_image.booru_dislikes=image.derpi_dislikes
            new_image.booru_link=image.derpi_link
            new_image.booru_date=image.derpi_date
            delete new_image.derpi_id
            delete new_image.derpi_likes
            delete new_image.derpi_dislikes
            delete new_image.derpi_link
            delete new_image.derpi_date
            await db_ops.image_ops.delete_image_by_id(image.id)
            await db_ops.image_ops.add_image_by_object(new_image)
        }
    }
}
async function run(){
    await change_schema()
    process.exit()
}
run()
