import db_ops from './../helpers/db_ops'
import { FastifyRequest, FastifyReply } from "fastify"
import { FromSchema } from "json-schema-to-ts";
const body_schema_update_image_data = {
    type: 'object',
    properties: {
        id: { type: 'number' },
        image_data: { type: "object" }
    },
    required: ["id", "image_data"],
} as const;

async function update_image_data(req: FastifyRequest<{ Body: FromSchema<typeof body_schema_update_image_data> }>, res: FastifyReply) {
    const id = req.body.id
    const image_data = req.body.image_data;
    if (req.session?.user_id) {
        const user = await db_ops.activated_user.find_user_by_id(req.session?.user_id)
        if (user && user.isAdmin) {
            db_ops.image_ops.update_image_data_by_id(id, image_data)
            return res.send({ message: "OK" })
        }
    }
    res.status(404).send();
}

export default {
    schema: {
        body: body_schema_update_image_data
    },
    handler: update_image_data
}