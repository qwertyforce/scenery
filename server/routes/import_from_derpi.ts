import db_ops from './../helpers/db_ops'
import { Request, Response } from 'express';
import axios from 'axios'
import fs from 'fs'
import path from 'path';
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
function get_domain(booru:string){
    switch(booru){
        case "derpibooru":
            return "https://www.derpibooru.org"
        case "ponerpics":
            return "https://ponerpics.org"
        case "ponybooru":
            return "https://ponybooru.org"
    }
}
async function import_from_derpi(req: Request, res: Response) {
    const allowed_boorus=["derpibooru","ponerpics","ponybooru"]
    const booru_import_id = parseInt(req.body.id);
    const ALLOWED_FORMATS = ["png", 'jpg', "jpeg"]
    const booru=req.body.booru
    if (req.session?.user_id && !isNaN(booru_import_id) && allowed_boorus.includes(booru)) {
        const user = await db_ops.activated_user.find_user_by_id(req.session?.user_id)
        if (user[0].isAdmin) {
            req.setTimeout(5*60*1000)
            try {
                const booru_domain=get_domain(req.body.booru)
                const imgs = await db_ops.image_ops.find_image_by_booru_id(booru,booru_import_id)
                if (imgs.length !== 0) {
                    res.json({ message: "Already in the DB" })
                    return
                }
                const response = await axios.get(`${booru_domain}/api/v1/json/images/${booru_import_id}`,{ headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36' }  });
                const booru_image_data = response.data.image
                if (!ALLOWED_FORMATS.includes(booru_image_data.format.toLowerCase())) {
                    res.json({ message: "format is not in allowed formats" })
                    return
                }
                const image =await axios.get((booru==="ponerpics")?booru_domain+booru_image_data.representations.full:booru_image_data.representations.full, {responseType: 'arraybuffer'})
                const new_image_id = (await db_ops.image_ops.get_max_image_id())+1
                await thumbnail_ops.generate_thumbnail(image.data,new_image_id)
                fs.writeFile(`${PATH_TO_IMAGES}/${new_image_id}.${booru_image_data.format.toLowerCase()}`, image.data, 'binary', function (err) {
                    if (err) {
                        console.log(`There was an error writing the image: ${booru} booru_id: ${booru_import_id} id: ${new_image_id}`)
                    }
                });           
                const parsed_author = await parse_author(booru_image_data.tags)
                const booru_link = `${booru_domain}/images/${booru_image_data.id}`
                const phash =await image_ops.get_phash(image.data)
                await image_ops.calculate_sift_features(new_image_id,image.data)
                await image_ops.calculate_color_hist_and_similarities(new_image_id,image.data)
                let orientation=""
                if(booru_image_data.height>booru_image_data.width){
                    orientation="vertical"
                }else if(booru_image_data.height<booru_image_data.width){
                    orientation="horizontal"
                }else{
                    orientation="square"
                }
                booru_image_data.tags.push(orientation)
                await db_ops.image_ops.add_image(new_image_id, booru_image_data.format.toLowerCase(), booru_image_data.width, booru_image_data.height, parsed_author, booru_image_data.size,
                booru_link, booru_image_data.upvotes, booru_image_data.downvotes, booru_image_data.id, booru_image_data.created_at,
                    booru_image_data.source_url, booru_image_data.tags, booru_image_data.wilson_score, booru_image_data.sha512_hash,
                     phash, booru_image_data.description,booru)
                console.log(`OK. New image_id: ${new_image_id}`)
                res.json({ message: `OK. New image_id: ${new_image_id}`})
                return
            } catch (error) {
                console.error(error);
            }

        }
    }
    res.sendStatus(404);
}

export default import_from_derpi;