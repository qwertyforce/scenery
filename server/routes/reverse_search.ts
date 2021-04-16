import { Request, Response } from 'express';
import { RecaptchaResponseV3 } from 'express-recaptcha/dist/interfaces';
import image_ops from '../helpers/image_ops'

async function reverse_search(req: Request, res: Response) {
    const recaptcha_score=(req.recaptcha as RecaptchaResponseV3)?.data?.score
    if (req.recaptcha?.error|| (typeof recaptcha_score==="number" && recaptcha_score<0.5)) {
        return res.status(403).json({
            message: "Captcha error"
        });
    }
    if(req.file){
        const Mode=parseInt(req.body.mode)
        req.connection.setTimeout(5*60000)//5min
        res.setTimeout(5*60000)//5min
        if(Mode===1){
            const ids=await image_ops.get_similar_images_by_phash(req.file.buffer)
            // console.log(ids)
            res.json({ids:ids.join(',')})
        }else if(Mode===2){
            const ids=await image_ops.get_similar_images_by_sift(req.file.buffer)
            // console.log(ids)
            res.json({ids:ids.join(',')})
        }
    }
}

export default reverse_search;