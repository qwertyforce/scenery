import db_ops from './../helpers/db_ops';
import mail_ops from './../helpers/mail_ops';
import crypto_ops from './../helpers/crypto_ops';
import config from '../../config/config'
import { validationResult } from 'express-validator';
import {Request, Response} from 'express';
import { RecaptchaResponseV3 } from 'express-recaptcha/dist/interfaces';
async function signup(req:Request,res:Response) {
    const recaptcha_score=(req.recaptcha as RecaptchaResponseV3)?.data?.score
    if (req.recaptcha?.error|| (typeof recaptcha_score==="number" && recaptcha_score<0.5)) {
        return res.status(403).json({
            message: "Captcha error"
        });
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: "email or password validation error"
        });
    }
    const email = req.body.email;
    const password = req.body.password
    const user_exists = await db_ops.activated_user.check_if_user_exists_by_email(email);
    if (!user_exists) { //if no user with this email is registered
        const token = await crypto_ops.generate_activation_token() //always unique
        const hashed_pass = await crypto_ops.hash_password(password);
        db_ops.not_activated_user.create_new_user_not_activated(email, hashed_pass, token)
        const link = `${config.domain}/activate?token=${token}`
        console.log(link)
        mail_ops.send_activation_letter(email, link)
        res.json({
            message: 'Registered successfully,please confirm your email.'
        })
    } else {
        res.status(403).json({
            message: 'User with same email is already registered'
        })
    }
}

export default signup;