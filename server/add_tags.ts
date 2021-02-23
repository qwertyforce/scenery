import db_ops from './helpers/db_ops'

async function add_tags() {
    const images = await db_ops.image_ops.get_all_images();
    for (const image of images) {
        let orientation=""
        if(!image.tags.includes("vertical") && !image.tags.includes("horizontal") && !image.tags.includes("square")){
            if(image.height>image.width){
                orientation="vertical"
            }else if(image.height<image.width){
                orientation="horizontal"
            }else{
                orientation="square"
            }
    
            await db_ops.image_ops.add_tags_to_image_by_id(image.id, [orientation])
        }
    }
}
async function run(){
    await add_tags()
    process.exit()
}
run()



