import axios from 'axios'
import { FastifyRequest, FastifyReply } from "fastify"
import { FromSchema } from "json-schema-to-ts";

const body_schema_proxy_get_image = {
    type: 'object',
    properties: {
        image_url: { type: 'string' },
        "g-recaptcha-response": { type: 'string' },
    },
    required: ['image_url', 'g-recaptcha-response'],
} as const;

function isValidURL(url: string) {
    const RegExp = /^(?:(?:(?:https?):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?$/i
    if (RegExp.test(url)) {
        return true;
    } else {
        return false;
    }
}

async function proxy_get_image(req: FastifyRequest<{ Body: FromSchema<typeof body_schema_proxy_get_image> }>, res: FastifyReply) {
    const ERROR_MESSAGE = "invalid url";
    const image_url = req.body.image_url;
    if (!isValidURL(image_url)) {
        return res.status(422).send({
            message: ERROR_MESSAGE
        });
    }
    const allowed = ["image/jpeg", "image/png"]
    try {
        const resp = await axios.head(image_url)
        const headers = resp.headers
        if (allowed.includes(headers["content-type"])) {
            if (headers["content-length"]) {
                const size = parseInt(headers["content-length"])
                if (!isNaN(size) && size < 50 * 10 ** 6) { //50mb
                    const img_resp = await axios.get(image_url, { responseType: 'stream' })
                    res.header("Content-Type", headers["content-type"])
                    return res.send(img_resp.data)
                    // const img = img_resp.data
                    // return res.send(img)
                } else {
                    return res.status(403).send({
                        message: 'image size is too big'
                    });
                }
            }
        } else {
            return res.status(403).send({
                message: 'not an image'
            });
        }
    } catch (err) {
        return res.status(403).send({
            message: 'something went wrong'
        });
    }
}

export default {
    schema: {
        body: body_schema_proxy_get_image
    },
    handler: proxy_get_image
}