import db_ops from './../helpers/db_ops';
import config from './../../config/config'
import { FastifyRequest, FastifyReply } from "fastify"
import { FromSchema } from "json-schema-to-ts";
const querystring_schema_activate_account_email = {
    type: 'object',
    properties: {
        token: { type: 'string' },
    },
    required: ['token'],
} as const;

async function activate_account_email(req: FastifyRequest<{ Querystring: FromSchema<typeof querystring_schema_activate_account_email> }>, res: FastifyReply) {
    const token = req.query.token;
    console.log(token)
    const not_activated_user = await db_ops.not_activated_user.find_not_activated_user_by_token(token);
    if (not_activated_user) {
        const activated_user_exists = await db_ops.activated_user.check_if_user_exists_by_email(not_activated_user.email)
        db_ops.not_activated_user.delete_not_activated_user_by_token(token) //remove temp account
        if (!activated_user_exists) {  //if user doesn't exits
            db_ops.activated_user.create_new_user_activated(not_activated_user.email, not_activated_user.password)
            return res.redirect(config.domain)
        }
    }
    res.send('<p>Activation link is wrong</p>')
}

export default {
    schema: {
        querystring: querystring_schema_activate_account_email
    },
    handler: activate_account_email
}