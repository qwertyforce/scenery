import db_ops from './../helpers/db_ops';
import crypto_ops from './../helpers/crypto_ops';
import { validationResult } from 'express-validator';
import {Request, Response} from 'express';
async function change_password(req:Request, res:Response) {
    if (req.recaptcha?.error) {
        return res.status(403).json({
            message: "Captcha error"
        });
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: "password validation error"
        });
    }
    const MESSAGE_FAIL = "Your link is expired or wrong";
    const MESSAGE_SUCCESS = "Password is successfully changed. Now you can log in using new password.";
    const token = req.body.token
    const password = req.body.password
    const obj = await db_ops.password_recovery.find_user_id_by_password_recovery_token(token);
    if (obj.length !== 0) { //IF password recovery token exists
        const user_id = obj[0].user_id
        const users = await db_ops.activated_user.find_user_by_id(user_id)
        if (users.length !== 0) { //IF user exists
            const hashed_pass = await crypto_ops.hash_password(password);
            db_ops.password_recovery.update_user_password_by_id(user_id, hashed_pass)
            db_ops.password_recovery.delete_password_recovery_token(token)
            return res.json({
                message: MESSAGE_SUCCESS
            })
        }
    }
    res.status(403).json({
        message: MESSAGE_FAIL
    })
}

export default change_password;