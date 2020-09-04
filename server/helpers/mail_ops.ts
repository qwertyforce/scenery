const nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
           user: 'auth.test.reg.email@gmail.com',
           pass: 'sbuLBh9rAV8XD2'
       }
   });
function send_activation_letter(email, link) {
    const mailOptions = {
        from: 'auth.test.reg.email@gmail.com', // sender address
        to: email, // list of receivers
        subject: 'Confirmation link', // Subject line
        html: `<p>Your confirmation link ${link} If it was not you, ignore this email.</p>` // plain text body
    };
    transporter.sendMail(mailOptions, function(err, info) {
        if (err) {
            console.log(err)
        } else {
            console.log(info);
        }
    });
}

function send_forgot_password_letter(email, link) {
    const mailOptions = {
        from: 'auth.test.reg.email@gmail.com', // sender address
        to: email, // list of receivers
        subject: 'Restore password link', // Subject line
        html: `<p>Your link to restore your password ${link} If it was not you, ignore this email.</p>` // plain text body
    };
    transporter.sendMail(mailOptions, function(err, info) {
        if (err) {
            console.log(err)
        } else {
            console.log(info);
        }
    });
}

module.exports =  {send_activation_letter,send_forgot_password_letter}