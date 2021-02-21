import {Request, Response} from 'express';
import db_ops from "../../helpers/db_ops"
import config from "../../../config/config"
async function get_all_images(_req:Request,res:Response) {
    const all_imgs=await db_ops.image_ops.get_all_images()
    const response_arr=[]
    for(const img of all_imgs){
        response_arr.push({
            id:img.id,
            created_at:img.created_at,
            booru:img.booru,
            ...(img.booru?{booru_id:img.booru_id}:{}),
            ...(img.booru?{booru_link:img.booru_link}:{}),
            width:img.width,
            height:img.height,
            tags:img.tags,
            author:img.author,
            size:img.size,
            phash:img.phash,
            sha512:img.sha512,
            source_url:img.source_url,
            image_link:`${config.domain}/images/${img.id}.${img.file_ext}`,
            thumbnail_link:`${config.domain}/thumbnails/${img.id}.jpg`,
            upscaled_link:(img.tags.includes("upscaled")?(`${config.domain}/upscaled/${img.id}.png`):false),
        })
    }
    res.json(response_arr)
}
export default get_all_images