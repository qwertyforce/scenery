import db_ops from './../helpers/db_ops';
import config from '../../config/config';
import axios from 'axios';
import {Request, Response} from 'express';
async function google_oauth_callback(req:Request, res:Response) {
    const code = req.query.code;
    try {
        const result = await axios.post("https://oauth2.googleapis.com/token", {
            code: code,
            redirect_uri: config.GOOGLE_REDIRECT_URI,
            client_secret: config.GOOGLE_CLIENT_SECRET,
            client_id: config.GOOGLE_CLIENT_ID,
            grant_type: "authorization_code"
        })
        const access_token = result.data.access_token
        console.log(result.data.access_token)

        const result2 = await axios.get(`https://people.googleapis.com/v1/people/me?personFields=names,emailAddresses&access_token=${access_token}`)
        console.log(result2.data)
        const google_id = result2.data.resourceName;
        const google_email = result2.data.emailAddresses[0].value;
        console.log(result2.data.resourceName);
        console.log(result2.data.emailAddresses[0].value);
        const user = await db_ops.activated_user.find_user_by_oauth_id(google_id)
        if (!user) {  //if no users with same oauth_id
            const usr_id = await db_ops.activated_user.create_new_user_activated_google(google_id, google_email)
            req.session.user_id = usr_id;
        } else {
            req.session.user_id = user.id;
        }
        req.session.authed = true;
        res.redirect(config.domain)
    } catch (e) {
        console.log(e)
    }
}

export default google_oauth_callback;