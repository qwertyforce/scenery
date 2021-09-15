import config from './../config/config'
import fastifyMultipart from 'fastify-multipart'
import fastify from 'fastify'
import formBodyPlugin from 'fastify-formbody'
import fastifyReplyFrom from 'fastify-reply-from'
const server = fastify()
const port = config.server_port

function combineURLs(baseURL: string, relativeURL: string) { //https://stackoverflow.com/a/49966753
    return relativeURL
        ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
        : baseURL;
}

import calculate_all_image_features from "./routes/calculate_all_image_features"
import delete_all_image_features from "./routes/delete_all_image_features"
import reverse_search from "./routes/reverse_search"

server.register(async function (app) {
    app.register(formBodyPlugin)
    app.register(fastifyMultipart, {
        attachFieldsToBody: true,
        sharedSchemaId: '#mySharedSchema',
        limits: {
            fieldNameSize: 100, // Max field name size in bytes
            fieldSize: 1000,     // Max field value size in bytes
            fields: 10,         // Max number of non-file fields
            fileSize: 50000000,  // For multipart forms, the max file size in bytes  //50MB
            files: 1,           // Max number of file fields
            headerPairs: 2000   // Max number of header key=>value pairs
        }
    })
    app.post("/calculate_all_image_features", calculate_all_image_features)
    app.post("/delete_all_image_features", delete_all_image_features)
    app.post("/reverse_search", reverse_search)
})

///////////////////////////////////////////////////////////////////////////////////////////////PROXY
server.register(fastifyReplyFrom)
server.addContentTypeParser('multipart/form-data', function (_request, payload, done) {
    done(null, payload)  //https://github.com/fastify/help/issues/67
})
const akaze_routes = ['/akaze_reverse_search', '/calculate_akaze_features', '/delete_akaze_features']
akaze_routes.forEach((r) => server.post(r, async (_req, res) => {
    try {
        res.from(combineURLs(config.akaze_microservice_url, r))
    } catch (err) {
        console.log(err)
        res.status(500).send('Akaze microservice is down')
    }
}))

const nn_routes = ['/nn_get_similar_images_by_image_buffer', '/nn_get_similar_images_by_text',
    '/nn_get_similar_images_by_id', '/calculate_nn_features', '/delete_nn_features', '/nn_get_image_tags_by_image_buffer']
nn_routes.forEach((r) => server.post(r, async (_req, res) => {
    try {
        res.from(combineURLs(config.nn_microservice_url, r))
    } catch (err) {
        console.log(err)
        res.status(500).send('NN microservice is down')
    }
}))

const hist_routes = ['/hist_get_similar_images_by_image_buffer', '/hist_get_similar_images_by_id', '/calculate_hist_features', '/delete_hist_features']
hist_routes.forEach((r) => server.post(r, async (_req, res) => {
    try {
        res.from(combineURLs(config.hist_microservice_url, r))
    } catch (err) {
        console.log(err)
        res.status(500).send('HIST microservice is down')
    }
}))

const phash_routes = ['/phash_reverse_search', '/calculate_phash_features', '/delete_phash_features']
phash_routes.forEach((r) => server.post(r, async (_req, res) => {
    try {
        res.from(combineURLs(config.phash_microservice_url, r))
    } catch (err) {
        console.log(err)
        res.status(500).send('Phash microservice is down')
    }
}))
////////////////////////////////////////////////////////////////////////////////////////////////////////////

server.listen(port, "127.0.0.1", function (err, address) {
    if (err) {
        console.error(err)
        process.exit(1)
    }
    console.log(`server listening on ${address}`)
})
