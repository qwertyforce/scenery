import nodemailer from 'nodemailer';
import config from '../../config/config'
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: config.gmail_user,
        pass: config.gmail_password
    }
});
function send_activation_letter(email: string, link: string): void {
    const mailOptions = {
        from: config.gmail_user, // sender address
        to: email, // list of receivers
        subject: 'Confirmation link', // Subject line
        html: `<p>Your confirmation link ${link} If it was not you, ignore this email.</p>` // plain text body
    };
    transporter.sendMail(mailOptions, function (err, info) {
        if (err) {
            console.log(err)
        } else {
            console.log(info);
        }
    });
}

function send_forgot_password_letter(email: string, link: string): void {
    const mailOptions = {
        from: config.gmail_user, // sender address
        to: email, // list of receivers
        subject: 'Restore password link', // Subject line
        html: `<p>Your link to restore your password ${link} If it was not you, ignore this email.</p>` // plain text body
    };
    transporter.sendMail(mailOptions, function (err, info) {
        if (err) {
            console.log(err)
        } else {
            console.log(info);
        }
    });
}

export default { send_activation_letter, send_forgot_password_letter }