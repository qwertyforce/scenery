const OAUTH=require('./../oauth_keys.js')
function google_oauth_redirect (req,res){
	const authorizeUrl = `https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&scope=https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email&response_type=code&client_id=${OAUTH.GOOGLE_CLIENT_ID}&redirect_uri=${OAUTH.GOOGLE_REDIRECT_URI}`;
    res.redirect(authorizeUrl);
}

module.exports = google_oauth_redirect;