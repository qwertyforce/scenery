import db_ops from './../helpers/db_ops'
import { validationResult } from 'express-validator'
import crypto_ops from './../helpers/crypto_ops'
import {Request, Response} from 'express';
import { RecaptchaResponseV3 } from 'express-recaptcha/dist/interfaces';

async function login(req:Request,res:Response) {
    const recaptcha_score=(req.recaptcha as RecaptchaResponseV3)?.data?.score
    if (req.recaptcha?.error|| (typeof recaptcha_score==="number" && recaptcha_score<0.5)) {
        return res.status(403).json({
            message: "Captcha error"
        });
    }
    const errors = validationResult(req);
    const MESSAGE_FOR_AUTH_ERROR = "This combination of email and password is not found";
    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: MESSAGE_FOR_AUTH_ERROR
        });
    }

    const email = req.body.email;
    const password = req.body.password
    const user = await db_ops.activated_user.find_user_by_email(email);
    if (!user) { //if user doesn't exists
        await crypto_ops.check_password("Random_text_qwfqwfg", "$2b$10$xKgSc736RxzT76ZMGyXMLe1Dge99d4PLyUOv60jpywAWJwftYcgjK"); // PROTECTION AGAINST TIMING ATTACK
        res.status(403).json({
            message: MESSAGE_FOR_AUTH_ERROR
        })
    } else {
        const match = await crypto_ops.check_password(password, user.password);
        if (match) {
            if (user.activated === true) {
                req.session.authed = true;
                req.session.user_id = user.id;
                res.json({
                    message: "success"
                })
            } else {
                res.status(403).json({
                    message: "Please confirm your email"
                })
            }
        } else {
            res.status(403).json({
                    message: MESSAGE_FOR_AUTH_ERROR
                })
        }
    }
}

export default login;