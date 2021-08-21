import config from "../../config/config"
import FormData from 'form-data'
import axios from 'axios'


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////


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


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
async function calculate_all_image_features(image_id: number, image_buffer: Buffer) {
    return Promise.allSettled([
        calculate_akaze_features(image_id, image_buffer),
        calculate_nn_features(image_id, image_buffer),
        calculate_hist_features(image_id, image_buffer),
        calculate_phash_features(image_id, image_buffer),
    ])
}

async function delete_all_image_features(image_id: number) {
    return Promise.allSettled([
        delete_akaze_features_by_id(image_id),
        delete_nn_features_by_id(image_id),
        delete_hist_features_by_id(image_id),
        delete_phash_features_by_id(image_id)
    ])
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
export default { calculate_all_image_features, delete_all_image_features, phash_reverse_search, akaze_reverse_search }