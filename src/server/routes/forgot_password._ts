import db_ops from './../helpers/db_ops';
import mail_ops from './../helpers/mail_ops';
import crypto_ops from './../helpers/crypto_ops';
import config from "../../config/config"
import { FastifyRequest, FastifyReply } from "fastify"
import { FromSchema } from "json-schema-to-ts";

const MESSAGE_SUCCESS = "Link for password recovery has been sent, check your email.";
const body_schema_forgot_password = {
    type: 'object',
    properties: {
        email: { type: 'string', format: "email" },
        "g-recaptcha-response": { type: 'string' },
    },
    required: ['email','g-recaptcha-response'],
} as const;

async function forgot_password(req: FastifyRequest<{ Body: FromSchema<typeof body_schema_forgot_password> }>, res: FastifyReply) {
    const email = req.body.email;
    const user = await db_ops.activated_user.find_user_by_email(email);
    if (user) {
        const token = await crypto_ops.generate_password_recovery_token()
        const user_id = user.id
        db_ops.password_recovery.save_password_recovery_token(token, user_id)
        const link = `${config.domain}/change_pw?token=${token}`
        mail_ops.send_forgot_password_letter(email, link)
    }
    return res.send({
        message: MESSAGE_SUCCESS
    }) //Always returns success even if email doesn`t exist
}

export default {
    schema: {
        body: body_schema_forgot_password
    },
    handler: forgot_password
}