import db_ops from './../helpers/db_ops'
import image_ops from './../helpers/image_ops'

import { FastifyRequest, FastifyReply } from "fastify"
import { FromSchema } from "json-schema-to-ts";
const body_schema_delete_image = {
    type: 'object',
    properties: {
        id: { type: 'number' },
    },
    required: ['id'],
} as const;

async function delete_image(req: FastifyRequest<{ Body: FromSchema<typeof body_schema_delete_image> }>, res: FastifyReply) {
    const id = req.body.id
    if (req.session?.user_id) {
        const user = await db_ops.activated_user.find_user_by_id(req.session?.user_id)
        if (user && user.isAdmin) {
            const result = await image_ops.delete_image(id)
            if (result) {
                res.send({ message: result })
            } else {
                res.send({ message: "fail" })
            }
        }
    } else {
        res.status(404).send();
    }
}

export default {
    schema: {
        body: body_schema_delete_image
    },
    handler: delete_image
}