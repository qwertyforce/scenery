const db_ops = require('./../helpers/db_ops.js')
const mail_ops = require('./../helpers/mail_ops.js')
const {validationResult} = require('express-validator')
const crypto_ops = require('./../helpers/crypto_ops.js')
async function forgot_password(req, res) {
    if (req.recaptcha.error) {
        return res.status(403).json({
            message: "Captcha error"
        });
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: "email validation error"
        });
    }
    const MESSAGE_SUCCESS = "Link for password recovery has been sent, check your email.";
    let email = req.body.email;
    let users = await db_ops.activated_user.find_user_by_email(email);
    if (users.length === 1) {
        let token = await crypto_ops.generate_password_recovery_token()
        let user_id = users[0].id
        db_ops.password_recovery.save_password_recovery_token(token, user_id)
        let link = `http://localhost:3000/change_pw/${token}`
        mail_ops.send_forgot_password_letter(email, link)
    }
    return res.json({
        message: MESSAGE_SUCCESS
    }) //Always returns success even if email doesn`t exist
}

module.exports = forgot_password;