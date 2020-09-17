const sharp = require('sharp');
const path = require('path')
const fs = require('fs')
const PATH_TO_IMAGES = path.join("..", 'public', 'images')
const PATH_TO_WEBP_IMAGES = path.join("..",'webp_images')
const WEBP_IMAGES = fs.readdirSync(PATH_TO_WEBP_IMAGES)
const IMAGES = fs.readdirSync(PATH_TO_IMAGES)

async function convert() {
    for (const image_file_name of IMAGES) {
        if(!WEBP_IMAGES.includes(`${path.parse(image_file_name).name}.webp`)){
            console.log(`converting ${image_file_name}`)
            const data = await sharp(`${PATH_TO_IMAGES}/${image_file_name}`)
                .webp({ quality: 80, reductionEffort: 6 })
                .toFile(`../webp_images/${path.parse(image_file_name).name}.webp`);
            console.log(data)
        }   
    }
}
convert()
