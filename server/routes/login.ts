import db_ops from './../helpers/db_ops'
import crypto_ops from './../helpers/crypto_ops'
import { FastifyRequest, FastifyReply } from "fastify"
import { FromSchema } from "json-schema-to-ts";

const MESSAGE_FOR_AUTH_ERROR = "This combination of email and password is not found";
const body_schema_login = {
    type: 'object',
    properties: {
        email: { type: 'string', format:"email" },
        password: { type: 'string', minLength: 8, maxLength: 128 },
        "g-recaptcha-response": { type: 'string' },
    },
    required: ["password", 'email','g-recaptcha-response'],
} as const;

async function login(req: FastifyRequest<{ Body: FromSchema<typeof body_schema_login> }>, res: FastifyReply) {
    const email = req.body.email;
    const password = req.body.password
    const user = await db_ops.activated_user.find_user_by_email(email);
    if (!user) { //if user doesn't exists
        await crypto_ops.check_password("Random_text_qwfqwfg", "$2b$10$xKgSc736RxzT76ZMGyXMLe1Dge99d4PLyUOv60jpywAWJwftYcgjK"); // PROTECTION AGAINST TIMING ATTACK
        res.status(403).send({
            message: MESSAGE_FOR_AUTH_ERROR
        })
    } else {
        const match = await crypto_ops.check_password(password, user.password);
        if (match) {
            if (user.activated === true) {
                req.session.authed = true;
                req.session.user_id = user.id;
                res.send({
                    message: "success"
                })
            } else {
                res.status(403).send({
                    message: "Please confirm your email"
                })
            }
        } else {
            res.status(403).send({
                message: MESSAGE_FOR_AUTH_ERROR
            })
        }
    }
}

export default {
    schema: {
        body: body_schema_login
    },
    handler: login
}
 