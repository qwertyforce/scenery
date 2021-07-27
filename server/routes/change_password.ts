import db_ops from './../helpers/db_ops';
import crypto_ops from './../helpers/crypto_ops';
import { FastifyRequest, FastifyReply } from "fastify"
import { FromSchema } from "json-schema-to-ts";

const MESSAGE_FAIL = "Your link is expired or wrong";
const MESSAGE_SUCCESS = "Password is successfully changed. Now you can log in using new password.";
const body_schema_change_password = {
    type: 'object',
    properties: {
        token: { type: 'string' },
        password: { type: 'string', minLength: 8, maxLength: 128 },
        "g-recaptcha-response": { type: 'string' },
    },
    required: ["password", 'token', 'g-recaptcha-response'],
} as const;


async function change_password(req: FastifyRequest<{ Body: FromSchema<typeof body_schema_change_password> }>, res: FastifyReply) {
    const token = req.body.token
    const password = req.body.password
    const obj = await db_ops.password_recovery.find_user_id_by_password_recovery_token(token);
    if (obj) { //IF password recovery token exists
        const user_id = obj.user_id
        const user_exists = await db_ops.activated_user.check_if_user_exists_by_id(user_id)
        if (user_exists) { //IF user exists
            const hashed_pass = await crypto_ops.hash_password(password);
            db_ops.password_recovery.update_user_password_by_id(user_id, hashed_pass)
            db_ops.password_recovery.delete_password_recovery_token(token)
            return res.send({
                message: MESSAGE_SUCCESS
            })
        }
    }
    res.status(403).send({
        message: MESSAGE_FAIL
    })
}

export default {
    schema: {
        body: body_schema_change_password
    },
    handler: change_password
}
