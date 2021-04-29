import db_ops from './../helpers/db_ops'
import { Request, Response } from 'express';
import image_ops from './../helpers/image_ops'

function isArrayOfStrings(arr:string[]) {
    for (let i = 0; i < arr.length; i++) {
        if (typeof arr[i] !== "string") {
            return false;
        }
    }
    return true;
}

async function import_image(req: Request, res: Response) {
    const image_buffer = req.file.buffer
    const source_url = req.body.source_url
    const tags = JSON.parse(req.body.tags)
    if (req.session?.user_id && Array.isArray(tags) && isArrayOfStrings(tags) && typeof source_url === "string") {
        const user = await db_ops.activated_user.find_user_by_id(req.session?.user_id)
        if (user.isAdmin) {
            req.setTimeout(5 * 60 * 1000)
            const success=await image_ops.import_image(image_buffer,tags,source_url)
            if(success){
                res.json({ message: "success" })
            }else{
                res.json({ message: "fail" })
            }
            
        }
    }
}

export default import_image;