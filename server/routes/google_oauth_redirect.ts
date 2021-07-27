import config from '../../config/config';
import { FastifyRequest, FastifyReply } from "fastify"

function google_oauth_redirect(_req: FastifyRequest, res: FastifyReply) {
    const authorizeUrl = `https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&scope=https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email&response_type=code&client_id=${config.GOOGLE_CLIENT_ID}&redirect_uri=${config.GOOGLE_REDIRECT_URI}`;
    res.redirect(authorizeUrl);
}

export default {
    handler: google_oauth_redirect
}

