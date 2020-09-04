const OAUTH=require('./../oauth_keys.js')
function github_oauth_redirect (req,res){
	const authorizeUrl = `https://github.com/login/oauth/authorize?client_id=${OAUTH.GITHUB_CLIENT_ID}`;
    res.redirect(authorizeUrl);
}

module.exports = github_oauth_redirect;