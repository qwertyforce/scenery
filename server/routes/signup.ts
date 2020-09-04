const OAUTH = require('./../oauth_keys.js')
const db_ops = require('./../helpers/db_ops.js')
const mail_ops = require('./../helpers/mail_ops.js')
const crypto_ops = require('./../helpers/crypto_ops.js')
const {validationResult} = require('express-validator');
async function signup(req, res) {
    if (req.recaptcha.error) {
        return res.status(403).json({
            message: "Captcha error"
        })
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: "email or password validation error"
        });
    }
    let email = req.body.email;
    let password = req.body.password
    let users = await db_ops.activated_user.find_user_by_email(email);
    if (users.length === 0) { //if no user with this email is registered
        let token = await crypto_ops.generate_activation_token() //always unique
        let hashed_pass = await crypto_ops.hash_password(password);
        db_ops.not_activated_user.create_new_user_not_activated(email, hashed_pass, token)
        let link = `http://localhost/activate?token=${token}`
        console.log(link)
        mail_ops.send_activation_letter(email, link)
        res.json({
            message: 'Registered successfully,please confirm your email.'
        })
    } else {
        console.log(users)
        res.json({
            message: 'User with same email is already registered'
        })
    }
}

module.exports = signup;