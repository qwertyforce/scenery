import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import config from "../../config/config"
const PATH_TO_IMAGES = path.join(config.root_path, 'public', 'images')
const PATH_TO_WEBP_IMAGES = path.join(config.root_path,'public','webp_images')
const WEBP_IMAGES = fs.readdirSync(PATH_TO_WEBP_IMAGES)
const IMAGES = fs.readdirSync(PATH_TO_IMAGES)

async function convert() {
    for (const image_file_name of IMAGES) {
        if(!WEBP_IMAGES.includes(`${path.parse(image_file_name).name}.webp`)){
            console.log(`converting ${image_file_name}`)
            const metadata = await sharp(`${PATH_TO_IMAGES}/${image_file_name}`).metadata()
            if(metadata && metadata.height && metadata.width){
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const x:any ={}
                if(metadata.width>metadata.height){

                    x.width=Math.min(metadata.width,750)
                }else if(metadata.width<metadata.height){
                    x.height=Math.min(metadata.height,750)
                }else{
                    x.width=Math.min(metadata.width,750)
                }
                const data = await sharp(`${PATH_TO_IMAGES}/${image_file_name}`).resize(x)
                .webp({ quality: 80, reductionEffort: 6 })
                .toFile(`${PATH_TO_WEBP_IMAGES}/${path.parse(image_file_name).name}.webp`);
            console.log(data)
            }
            
        }   
    }
}
convert()
