import db_ops from './../helpers/db_ops';
import mail_ops from './../helpers/mail_ops';
import crypto_ops from './../helpers/crypto_ops';
import { validationResult } from 'express-validator';
import {Request, Response} from 'express';
import config from "../../config/config"
async function forgot_password(req:Request, res:Response) {
    if (req.recaptcha?.error) {
        return res.status(403).json({
            message: "Captcha error"
        });
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: "email validation error"
        });
    }
    const MESSAGE_SUCCESS = "Link for password recovery has been sent, check your email.";
    const email = req.body.email;
    const users = await db_ops.activated_user.find_user_by_email(email);
    if (users.length === 1) {
        const token = await crypto_ops.generate_password_recovery_token()
        const user_id = users[0].id
        db_ops.password_recovery.save_password_recovery_token(token, user_id)
        const link = `${config.domain}/change_pw?token=${token}`
        mail_ops.send_forgot_password_letter(email, link)
    }
    return res.json({
        message: MESSAGE_SUCCESS
    }) //Always returns success even if email doesn`t exist
}

export default forgot_password;