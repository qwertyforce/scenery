/* eslint-disable @typescript-eslint/no-non-null-assertion */
import config from '../../config/config';
import axios from 'axios';
import db_ops from '../helpers/db_ops';
import { launch } from 'puppeteer';
import {promises as fs} from 'fs'
function sleep(ms:number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function get_token(){
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', config.deviant_art_client_id);
    params.append('client_secret', config.deviant_art_client_secret);
    const result = await axios.post("https://www.deviantart.com/oauth2/token", params,{withCredentials: true})
    const access_token = result.data.access_token
    return access_token
}

async function deviant_art_checker() {
    const browser = await launch({ headless: true,args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const images = await db_ops.image_ops.get_all_images()
    let access_token = await get_token()
    for (const image of images) {
        console.log(image.id)
        if (image.source_url?.includes("deviantart.com")) {
            await sleep(3000)
            try {
                const page = await browser.newPage();
                const x = await page.goto(image.source_url,{waitUntil:"domcontentloaded"});
                if(!x){
                    continue
                }
                const text=await x.text()
                page.close()
                const idx_1 = text.indexOf("DeviantArt://deviation/")
                const error = text.indexOf("403 ERROR")
                if(error!==-1){
                    console.log("403 ERROR")
                    await sleep(5000)
                    continue
                }
                if (idx_1 === -1) {
                    console.log("not_found")
                    continue;
                }
                const deviant_art_id = text.slice(idx_1 + 23, text.indexOf(`"/>`, idx_1))
                const res = await axios.get(`https://www.deviantart.com/api/v1/oauth2/deviation/download/${deviant_art_id}?mature_content=true&access_token=${access_token}`,{withCredentials: true})
                if(image.width*image.height<res.data.width*res.data.height){
                    const new_img= await axios.get(res.data.src,{responseType: 'arraybuffer'})
                    console.log(`${config.root_path}/public/images/${image.id}.${image.file_ext}`)
                    await fs.writeFile(`${config.root_path}/public/images/${image.id}.${image.file_ext}`,new_img.data,"binary")
                    await db_ops.image_ops.update_image_data_by_id(image.id,{width:res.data.width,height:res.data.height,size:res.data.filesize})
                    console.log(res.data)
                }
            } catch (e) {
                console.log(`img_id ${image.id} ${e.response?.status}`)
                if(e.response?.status===401){
                    access_token = await get_token()
                }
                // console.log(e.response?.data)
            }

        }
    }
}


async function run() {
    await deviant_art_checker()
    process.exit()
  }
  run()