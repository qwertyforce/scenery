import config from '../../config/config';
import { FastifyRequest, FastifyReply } from "fastify"

function github_oauth_redirect (_req:FastifyRequest,res:FastifyReply){
	const authorizeUrl = `https://github.com/login/oauth/authorize?client_id=${config.GITHUB_CLIENT_ID}`;
    res.redirect(authorizeUrl);
}

export default {
    handler: github_oauth_redirect
}

