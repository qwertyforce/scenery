/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-var-requires */
// import db_ops from './../helpers/db_ops'
import { Request, Response } from 'express';
import {temp_images} from './reverse_search_global'

async function temp_image(req: Request, res: Response) {
    const image_id=req.params["image_id"]
    if(temp_images.get(image_id)){
        const image=temp_images.get(image_id)
        res.type(image.mimetype)
        res.send(image.buffer)
    }else{
        res.send("error")
    }
}

export default temp_image;