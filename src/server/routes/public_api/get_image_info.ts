import db_ops from './../../helpers/db_ops'
import { FastifyRequest, FastifyReply } from "fastify"
import { FromSchema } from "json-schema-to-ts"
const params_schema_get_image_info = {
    type: 'object',
    properties: {
        id: { type: 'string' },
    },
    required: ['id'],
} as const

async function get_image_info(req: FastifyRequest<{ Params: FromSchema<typeof params_schema_get_image_info> }>, res: FastifyReply) {
    const id = parseInt(req.params.id)
    if (!isNaN(id)) {
        const image = await db_ops.image_ops.find_image_by_id(id)
        return image
    }
    return res.status(404).send()
}

export default {
    schema: {
        params: params_schema_get_image_info
    },
    handler: get_image_info
}