import db_ops from './../helpers/db_ops';
import config from '../../config/config'
import {Request, Response} from 'express';
async function activate_account_email (req:Request, res:Response){
	const token = req.query.token;
    console.log(token)
    if (typeof token == 'string') {
        const not_activated_user = await db_ops.not_activated_user.find_not_activated_user_by_token(token);
        if (not_activated_user) {
            const activated_user_exists=await db_ops.activated_user.check_if_user_exists_by_email(not_activated_user.email)
            db_ops.not_activated_user.delete_not_activated_user_by_token(token) //remove temp account
            if(!activated_user_exists){  //if user doesn't exits
                db_ops.activated_user.create_new_user_activated(not_activated_user.email, not_activated_user.password)
                return res.redirect(config.domain)
            }
        }
    }
    res.send('<p>Activation link is wrong</p>')
}

export default activate_account_email;