import db_ops from './../helpers/db_ops';
import mail_ops from './../helpers/mail_ops';
import crypto_ops from './../helpers/crypto_ops';
import config from '../../config/config'

import { FastifyRequest, FastifyReply } from "fastify"
import { FromSchema } from "json-schema-to-ts";
const body_schema_signup = {
    type: 'object',
    properties: {
        email: { type: 'string', format: "email" },
        password: { type: 'string', minLength: 8, maxLength: 128 },
        "g-recaptcha-response": { type: 'string' },
    },
    required: ["password", 'email','g-recaptcha-response'],
} as const;

async function signup(req: FastifyRequest<{ Body: FromSchema<typeof body_schema_signup> }>, res: FastifyReply) {
    const email = req.body.email;
    const password = req.body.password
    const user_exists = await db_ops.activated_user.check_if_user_exists_by_email(email)
    if (!user_exists) { //if no user with this email is registered
        const token = await crypto_ops.generate_activation_token() //always unique
        const hashed_pass = await crypto_ops.hash_password(password);
        db_ops.not_activated_user.create_new_user_not_activated(email, hashed_pass, token)
        const link = `${config.domain}/activate?token=${token}`
        console.log(link)
        mail_ops.send_activation_letter(email, link)
        res.send({
            message: 'Registered successfully,please confirm your email.'
        })
    } else {
        res.status(403).send({
            message: 'User with same email is already registered'
        })
    }
}

export default {
    schema: {
        body: body_schema_signup
    },
    handler: signup
}