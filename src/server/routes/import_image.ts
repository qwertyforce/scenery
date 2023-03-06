import db_ops from './../helpers/db_ops'
import image_ops from './../helpers/image_ops'
import { FastifyRequest, FastifyReply } from "fastify"
import { FromSchema } from "json-schema-to-ts"
import config from "./../../config/config"

const body_schema_import_image = {
    type: 'object',
    properties: {
        image: {
            type: 'object',
            properties: {
                encoding: { type: 'string' },
                filename: { type: 'string' },
                limit: { type: 'boolean' },
                mimetype: { type: 'string' }
            }
        },
        source_url: {
            type: "object",
            properties: {
                value: { type: 'string' }
            }
        },
        tags: {
            type: "object",
            properties: {
                value: { type: "string" }
            }
        },
        import_images_bot_password: {
            type: "object",
            properties: {
                value: { type: "string" }
            }
        },
    },
    required: ['image'],
} as const;

function isValidURL(url: string) {
    const RegExp = /^(?:(?:(?:https?):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?$/i
    if (RegExp.test(url)) {
        return true;
    } else {
        return false;
    }
}

async function import_image(req: FastifyRequest<{ Body: FromSchema<typeof body_schema_import_image> }>, res: FastifyReply) {
    const source_url = req.body?.source_url?.value
    if (source_url && !isValidURL(source_url)) {
        return res.status(422).send({
            message: "invalid url"
        });
    }
    let image_buffer: Buffer;
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        image_buffer = await (req as any).body.image.toBuffer()
        if (!Buffer.isBuffer(image_buffer)){
            throw "not a buffer"
        }
    } catch (err) {
        return res.status(500).send()
    }

    const tags = []
    if (req.body.tags?.value) {
        const parsed_tags = JSON.parse(req.body.tags?.value)
        for (const tag of parsed_tags) {
            if (typeof tag === "string") {
                tags.push(tag)
            }
        }
    }

    if (config.import_images_bot_password !== "" && config.import_images_bot_password === req.body?.import_images_bot_password?.value) { //refactor later
        const results = await image_ops.import_image(image_buffer, tags, source_url)
        if (results) {
            res.send({ message: results })
        } else {
            res.send({ message: "fail" })
        }
    } else if (req.session?.user_id) {
        const user = await db_ops.activated_user.find_user_by_id(req.session.user_id)
        if (user && user.isAdmin) {
            const results = await image_ops.import_image(image_buffer, tags, source_url)
            if (results) {
                res.send({ message: results })
            } else {
                res.send({ message: "fail" })
            }
        }
    }
}

export default {
    schema: {
        body: body_schema_import_image
    },
    handler: import_image
}