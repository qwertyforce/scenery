const OAUTH = require('./../oauth_keys.js')
const db_ops = require('./../helpers/db_ops.js')
const axios = require('axios')
async function github_oauth_callback(req, res) {
    let code = req.query.code;
    try {
        let result = await axios({
            method: 'post',
            url: `https://github.com/login/oauth/access_token?client_id=${OAUTH.GITHUB_CLIENT_ID}&client_secret=${OAUTH.GITHUB_CLIENT_SECRET}&code=${code}`,
            headers: {
                accept: 'application/json'
            }
        })
        let access_token = result.data.access_token
        console.log(result.data.access_token)

        let result2 = await axios({
            method: 'get',
            url: 'https://api.github.com/user',
            headers: {
                accept: 'application/json',
                Authorization: 'token ' + access_token
            }
        })
        let oauth_id = result2.data.id
        console.log(oauth_id)
        let users = await db_ops.activated_user.find_user_by_oauth_id(oauth_id)
        if (users.length === 0) {
            let usr_id = await db_ops.activated_user.create_new_user_activated_github(oauth_id)
            req.session.user_id = usr_id;
        } else {
            req.session.user_id = users[0].id;
        }
        req.session.authed = true;
        res.redirect("http://localhost:3000/")
    } catch (e) {
        console.log(e)
    }
}

module.exports = github_oauth_callback;