import db_ops from './../helpers/db_ops';
import mail_ops from './../helpers/mail_ops';
import crypto_ops from './../helpers/crypto_ops';
import config from '../../config/config'
import { validationResult } from 'express-validator';
import {Request, Response} from 'express';
async function signup(req:Request,res:Response) {
    if (req.recaptcha?.error) {
        return res.status(403).json({
            message: "Captcha error"
        })
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: "email or password validation error"
        });
    }
    const email = req.body.email;
    const password = req.body.password
    const users = await db_ops.activated_user.find_user_by_email(email);
    if (users.length === 0) { //if no user with this email is registered
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
        console.log(users)
        res.json({
            message: 'User with same email is already registered'
        })
    }
}

export default signup;