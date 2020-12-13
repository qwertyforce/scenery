/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { RecaptchaResponseV3 } from 'express-recaptcha/dist/interfaces';
import { validationResult } from 'express-validator'
import {Request, Response} from 'express';
import axios from 'axios'

function isValidURL(url:string){
    const RegExp = /^(?:(?:(?:https?):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?$/i
    if(RegExp.test(url)){
        return true;
    }else{
        return false;
    }
  } 

async function proxy_get_image(req:Request,res:Response) {
    const recaptcha_score=(req.recaptcha as RecaptchaResponseV3)?.data?.score
    if (req.recaptcha?.error|| (typeof recaptcha_score==="number" && recaptcha_score<0.5)) {
        return res.status(403).json({
            message: "Captcha error"
        });
    }
    const errors = validationResult(req);
    const ERROR_MESSAGE = "invalid url";
    const image_url = req.body.image_url;
    if (!errors.isEmpty() || !isValidURL(image_url)) {
        return res.status(422).json({
            message: ERROR_MESSAGE
        });
    }
    const allowed=["image/jpeg","image/png"]    
    try{
        const resp= await axios.head(image_url)
        const headers=resp.headers
        console.log(headers)
        if(allowed.includes(headers["content-type"])){   
            if(headers["content-length"]){
                const size=parseInt(headers["content-length"])
                if(!isNaN(size) && size<50*10**6){ //50mb
                    const img_resp= await axios.get(image_url,{responseType: 'stream'})
                    return img_resp.data.pipe(res)
                    // const img = img_resp.data
                    // return res.send(img)
                 }else{
                    return res.status(403).json({
                        message: 'image size is too big'
                    });  
                }
            }
        }else{
            return res.status(403).json({
                message: 'not an image'
            });  
        }
    }catch(err){
        return res.status(403).json({
            message: 'something went wrong'
        });
    }
}

export default proxy_get_image;