const OAUTH = require('./../oauth_keys.js')
const db_ops = require('./../helpers/db_ops.js')
const axios = require('axios')
async function google_oauth_callback(req, res) {
    let code = req.query.code;
    try {
        let result = await axios.post("https://oauth2.googleapis.com/token", {
            code: code,
            redirect_uri: OAUTH.GOOGLE_REDIRECT_URI,
            client_secret: OAUTH.GOOGLE_CLIENT_SECRET,
            client_id: OAUTH.GOOGLE_CLIENT_ID,
            grant_type: "authorization_code"
        })
        let access_token = result.data.access_token
        console.log(result.data.access_token)

        let result2 = await axios.get(`https://people.googleapis.com/v1/people/me?personFields=names,emailAddresses&access_token=${access_token}`)
        console.log(result2.data)
        let google_id = result2.data.resourceName;
        let google_email = result2.data.emailAddresses[0].value;
        console.log(result2.data.resourceName);
        console.log(result2.data.emailAddresses[0].value);
        let users = await db_ops.activated_user.find_user_by_oauth_id(google_id)
        if (users.length === 0) {
            let usr_id = await db_ops.activated_user.create_new_user_activated_google(google_id, google_email)
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

module.exports = google_oauth_callback;