/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-var-requires */
// import db_ops from './../helpers/db_ops'
import { Request, Response } from 'express';
import db_ops from '../helpers/db_ops'
const imghash: any = require('imghash');
function hamming_distance(str1: string, str2: string) {
    let distance = 0;
    for (let i = 0; i < str1.length; i += 1) {
        if (str1[i] !== str2[i]) {
            distance += 1;
        }
    }
    return distance;
}
async function reverse_search(req: Request, res: Response) {
    if (req.recaptcha?.error) {
        return res.status(403).json({
            message: "Captcha error"
        })
    }
    const phash= await imghash.hash(req.file.buffer,16)
    const images=await db_ops.image_ops.get_ids_and_phashes()
    for(let i=0;i<images.length;i++){
        images[i].dist=hamming_distance(phash,images[i].phash)
    }
    images.sort((a,b)=>a.dist-b.dist)
    images.length=30
    const ids=images.map((el)=>el.id)
    res.json({ids:ids.join(',')})
}

export default reverse_search;