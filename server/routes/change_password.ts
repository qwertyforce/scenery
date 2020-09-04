const db_ops = require('./../helpers/db_ops.js')
const {validationResult} = require('express-validator')
const crypto_ops = require('./../helpers/crypto_ops.js')
async function change_password(req, res) {
    if (req.recaptcha.error) {
        return res.status(403).json({
            message: "Captcha error"
        });
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: "password validation error"
        });
    }
    const MESSAGE_FAIL = "Your link is expired or wrong";
    const MESSAGE_SUCCESS = "Password is successfully changed. Now you can log in using new password.";
    let token = req.body.token
    let password = req.body.password
    let obj = await db_ops.password_recovery.find_user_id_by_password_recovery_token(token);
    if (obj.length !== 0) { //IF password recovery token exists
        let user_id = obj[0].user_id
        let users = await db_ops.activated_user.find_user_by_id(user_id)
        if (users.length !== 0) { //IF user exists
            let hashed_pass = await crypto_ops.hash_password(password);
            db_ops.password_recovery.update_user_password_by_id(user_id, hashed_pass)
            db_ops.password_recovery.delete_password_recovery_token(token)
            return res.json({
                message:MESSAGE_SUCCESS
            })
        }
    }
    res.status(403).json({
        message: MESSAGE_FAIL
    })
}

module.exports = change_password;