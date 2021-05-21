import express from 'express'
import { Request, Response } from 'express';
// import bodyParser from 'body-parser';
import multer from 'multer'
import config from './../config/config'
import httpProxy from 'http-proxy'
import axios from 'axios'
import FormData from 'form-data'

const app = express()
// app.use(bodyParser.json())
app.disable('x-powered-by')
const apiProxy = httpProxy.createProxyServer()
const port = config.server_port
const storage = multer.memoryStorage()
const upload_100MB = multer({ storage: storage, limits: { files: 1, fileSize: 100000000 } })  //100MB

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
async function calculate_phash_features(image_id: number, image: Buffer) {
    const form = new FormData();
    form.append('image', image, { filename: 'document' }) //hack to make nodejs buffer work with form-data
    form.append('image_id', image_id.toString())
    const status = await axios.post(`${config.phash_microservice_url}/calculate_phash_features`, form.getBuffer(), {
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        headers: {
            ...form.getHeaders()
        }
    })
    return status.data
}

async function calculate_akaze_features(image_id: number, image: Buffer) {
    const form = new FormData();
    form.append('image', image, { filename: 'document' }) //hack to make nodejs buffer work with form-data
    form.append('image_id', image_id.toString())
    const status = await axios.post(`${config.akaze_microservice_url}/calculate_akaze_features`, form.getBuffer(), {
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        headers: {
            ...form.getHeaders()
        }
    })
    return status.data
}
async function calculate_nn_features(image_id: number, image: Buffer) {
    const form = new FormData();
    form.append('image', image, { filename: 'document' }) //hack to make nodejs buffer work with form-data
    form.append('image_id', image_id.toString())
    const status = await axios.post(`${config.nn_microservice_url}/calculate_nn_features`, form.getBuffer(), {
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        headers: {
            ...form.getHeaders()
        }
    })
    return status.data
}

async function calculate_hist_features(image_id: number, image: Buffer) {
    const form = new FormData();
    form.append('image', image, { filename: 'document' }) //hack to make nodejs buffer work with form-data
    form.append('image_id', image_id.toString())
    const status = await axios.post(`${config.hist_microservice_url}/calculate_hist_features`, form.getBuffer(), {
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        headers: {
            ...form.getHeaders()
        }
    })
    return status.data
}

async function phash_reverse_search(image: Buffer) {
    try {
        const form = new FormData();
        form.append('image', image, { filename: 'document' }) //hack to make nodejs buffer work with form-data
        const status = await axios.post(`${config.phash_microservice_url}/phash_reverse_search`, form.getBuffer(), {
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            headers: {
                ...form.getHeaders()
            }
        })
        return status.data
    } catch (err) {
        console.log(err)
        return []
    }
}

async function akaze_reverse_search(image: Buffer) {
    try {
        const form = new FormData();
        form.append('image', image, { filename: 'document' }) //hack to make nodejs buffer work with form-data
        const status = await axios.post(`${config.akaze_microservice_url}/akaze_reverse_search`, form.getBuffer(), {
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            headers: {
                ...form.getHeaders()
            }
        })
        return status.data
    } catch (err) {
        console.log(err)
        return []
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
async function delete_akaze_features_by_id(image_id: number) {
    const status = await axios.post(`${config.akaze_microservice_url}/delete_akaze_features`, { image_id: image_id })
    return status.data
}

async function delete_nn_features_by_id(image_id: number) {
    const status = await axios.post(`${config.nn_microservice_url}/delete_nn_features`, { image_id: image_id })
    return status.data
}

async function delete_hist_features_by_id(image_id: number) {
    const status = await axios.post(`${config.hist_microservice_url}/delete_hist_features`, { image_id: image_id })
    return status.data
}

async function delete_phash_features_by_id(image_id: number) {
    const status = await axios.post(`${config.phash_microservice_url}/delete_phash_features`, { image_id: image_id })
    return status.data
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
async function calculate_all_image_features(image_id: number, image_buffer: Buffer) {
    return Promise.allSettled([
        calculate_akaze_features(image_id, image_buffer),
        calculate_nn_features(image_id, image_buffer),
        calculate_hist_features(image_id, image_buffer),
        calculate_phash_features(image_id, image_buffer),
    ])
}

async function delete_image_features(image_id: number) {
    return Promise.allSettled([
        delete_akaze_features_by_id(image_id),
        delete_nn_features_by_id(image_id),
        delete_hist_features_by_id(image_id),
        delete_phash_features_by_id(image_id)
    ])
}
///////////////////////////////////////////////////////////////////////////////////////////////ALL
app.post('/calculate_all_image_features', [upload_100MB.single('image')], async (req: Request, res: Response) => {
    const image_id = parseInt(req.body.image_id)
    if (req.file && typeof image_id === "number") {
        const results = await calculate_all_image_features(image_id, req.file.buffer)
        console.log(results)
        res.send(results)
    } else {
        return res.sendStatus(403)
    }
})

app.post('/delete_all_image_features', async (req: Request, res: Response) => {
    const image_id = parseInt(req.body.image_id)
    if (typeof image_id === "number") {
        const results = await delete_image_features(image_id)
        console.log(results)
        res.send(results)
    } else {
        return res.sendStatus(403)
    }
})

app.post('/reverse_search', [upload_100MB.single('image')], async (req: Request, res: Response) => {
    if (req.file) {
        const phash_found=await phash_reverse_search(req.file.buffer)
        if(phash_found.length!==0){
            res.json(phash_found)
        }else{
            const akaze_found=await akaze_reverse_search(req.file.buffer)
            res.json(akaze_found)
        }
    } else {
        return res.sendStatus(403)
    }
})

///////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////PROXY
app.post(['/akaze_reverse_search','/calculate_akaze_features','/delete_akaze_features'], async (req, res) => {
    try {
        apiProxy.web(req, res, { target: config.akaze_microservice_url });
    } catch (err) {
        res.status(500).send('Akaze microservice is down')
    }
})

app.post(['/nn_get_similar_images_by_image_buffer','/nn_get_similar_images_by_text',
'/nn_get_similar_images_by_id','/calculate_nn_features','/delete_nn_features'], async (req, res) => {
    try {
        apiProxy.web(req, res, { target: config.nn_microservice_url });
    } catch (err) {
        res.status(500).send('NN microservice is down')
    }
})
app.post(['/hist_get_similar_images_by_image_buffer','/hist_get_similar_images_by_id','/calculate_hist_features','/delete_hist_features'], async (req, res) => {
    try {
        apiProxy.web(req, res, { target: config.hist_microservice_url });
    } catch (err) {
        res.status(500).send('HIST microservice is down')
    }
})

app.post(['/phash_reverse_search','/calculate_phash_features','/delete_phash_features'], async (req, res) => {
    try {
        apiProxy.web(req, res, { target: config.phash_microservice_url });
    } catch (err) {
        res.status(500).send('Phash microservice is down')
    }
})

////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});