import db_ops from './../helpers/db_ops'
import crypto from 'crypto'
import { Request, Response } from 'express';
import fs from 'fs'
import path from 'path';
import sharp from "sharp"
import image_ops from './../helpers/image_ops'
import thumbnail_ops from '../helpers/thumbnail_ops'
const PATH_TO_IMAGES = path.join(process.cwd(), 'public', 'images')
async function parse_author(tags: string[]) {
    for (const tag of tags) {
        const idx = tag.indexOf("artist:")
        if (idx === 0) {    //tag starts with "artist:" 
            return tag.slice(7) //strip off "artist:" 
        }
    }
    return "???"
}

async function import_image(req: Request, res: Response) {
    let file_ext=""
    switch(req.file.mimetype){
        case "image/png":
            file_ext="png"
            break
        case "image/jpeg":
            file_ext="jpg"
            break
    }
    const image_buffer=req.file.buffer
    const metadata = await sharp(image_buffer).metadata()
    const size=metadata.size||10
    const height=metadata.height||10
    const width=metadata.width||10
    const source_url=req.body.source_url
    const tags= JSON.parse(req.body.tags)
    if (req.session?.user_id && Array.isArray(tags)) {
        const user = await db_ops.activated_user.find_user_by_id(req.session?.user_id)
        if (user[0].isAdmin) {
            req.setTimeout(5*60*1000)
            try {
                const sha512_hash=crypto.createHash('sha512').update(image_buffer).digest("hex")
                const new_image_id = (await db_ops.image_ops.get_max_image_id())+1
                await thumbnail_ops.generate_thumbnail(image_buffer,new_image_id)
                fs.writeFile(`${PATH_TO_IMAGES}/${new_image_id}.${file_ext}`, image_buffer, 'binary', function (err) {
                    if (err) {
                        console.log(`There was an error writing the image imported from file. source_url:${source_url}`)
                    }
                });           
                const parsed_author = await parse_author(tags)
                const phash =await image_ops.get_phash(image_buffer)
                await image_ops.calculate_sift_features(new_image_id,image_buffer)
                await image_ops.calculate_color_hist_and_similarities(new_image_id,image_buffer)
                let orientation=""
                if(height>width){
                    orientation="vertical"
                }else if(height<width){
                    orientation="horizontal"
                }else{
                    orientation="square"
                }
                tags.push(orientation)
                await db_ops.image_ops.add_image(new_image_id, file_ext, width, height, parsed_author, size,
                false, 0, 0, false, false,source_url, tags, 0, sha512_hash,phash, "",false)
                console.log(`OK. New image_id: ${new_image_id}`)
                res.json({ message: `OK. New image_id: ${new_image_id}`})
                return
            } catch (error) {
                console.error(error);
            }

        }
    }
}

export default import_image;