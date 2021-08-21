import { FastifyRequest, FastifyReply } from "fastify"
import { FromSchema } from "json-schema-to-ts";
import image_ops from "./../helpers/image_ops"
const body_schema_delete_all_image_features = {
    type: 'object',
    properties: {
        image_id: { type: "number" }
    },
    required: ['image_id'],
} as const;

async function delete_all_image_features(req: FastifyRequest<{ Body: FromSchema<typeof body_schema_delete_all_image_features> }>, res: FastifyReply) {
    const results = await image_ops.delete_all_image_features(req.body.image_id)
    console.log(results)
    res.send(results)
}

export default {
    schema: {
        body: body_schema_delete_all_image_features
    },
    handler: delete_all_image_features
}