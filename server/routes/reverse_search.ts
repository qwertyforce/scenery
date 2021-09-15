import image_ops from '../helpers/image_ops'
import sharp from 'sharp'
import { FastifyRequest, FastifyReply } from "fastify"

const body_schema_reverse_search = {
    type: 'object',
    image: { $ref: '#mySharedSchema' },
    properties: {
        "g-recaptcha-response": { type: 'string' },
    },
    required: ['image', 'g-recaptcha-response'],
} as const;

async function reverse_search(req: FastifyRequest, res: FastifyReply) {
    let image_buffer: Buffer;
    try {
        image_buffer = await (req as any).body.image.toBuffer()
    } catch (err) {
        return res.send({ ids: '' })
    }

    const metadata = await sharp(image_buffer).metadata()
    if (metadata.orientation) {  //rotate according to EXIF
      image_buffer = await sharp(image_buffer).rotate().toBuffer()
    }
    
    const ids = await image_ops.reverse_search(image_buffer)
    // console.log(ids)
    res.send({ ids: ids.join(',') })
}

export default {
    schema: {
        body: body_schema_reverse_search
    },
    handler: reverse_search
}