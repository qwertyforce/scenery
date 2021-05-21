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
        req.connection.setTimeout(5*60000)//5min
        res.setTimeout(5*60000)//5min
        const ids=await image_ops.reverse_search(req.file.buffer)
         // console.log(ids)
        res.json({ids:ids.join(',')})
    }
}

export default reverse_search;