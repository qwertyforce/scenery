import { FastifyRequest, FastifyReply } from "fastify"
import { FromSchema } from "json-schema-to-ts";
import image_ops from "./../helpers/image_ops"
const body_schema_calculate_all_image_features = {
    type: 'object',
    properties: {
        image: { $ref: '#mySharedSchema' },
        image_id: {
            type: "object",
            properties: {
                value: { type: 'string' }
            }
        },
    },
    required: ['image', 'image_id'],
} as const;

async function calculate_all_image_features(req: FastifyRequest<{ Body: FromSchema<typeof body_schema_calculate_all_image_features> }>, res: FastifyReply) {
    let image_buffer: Buffer;
    try {
        image_buffer = await (req as any).body.image.toBuffer()
    } catch (err) {
        return res.status(500).send()
    }
    if (req.body.image_id.value) {
        const image_id = parseInt(req.body.image_id.value)
        const results = await image_ops.calculate_all_image_features(image_id, image_buffer)
        console.log(results)
        res.send(results)
    }
}

export default {
    schema: {
        body: body_schema_calculate_all_image_features
    },
    handler: calculate_all_image_features
}