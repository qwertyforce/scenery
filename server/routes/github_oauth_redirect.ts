import config from '../../config/config';
import {Request,Response} from 'express';
function github_oauth_redirect (_req:Request,res:Response){
	const authorizeUrl = `https://github.com/login/oauth/authorize?client_id=${config.GITHUB_CLIENT_ID}`;
    res.redirect(authorizeUrl);
}

export default github_oauth_redirect;