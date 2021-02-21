import { Request, Response } from 'express';
import axios from "axios"
import config from "../../../config/config"
export const temp_images = new Map()
const boorus = [
    { url: "https://ponerpics.org", api_key: "e1YPLqyucu0uYe5_xyXA" },
    { url: "https://ponybooru.org", api_key: "naYHZRiiFTz9j9shwkx3" },
    { url: "https://booru.bronyhub.com", api_key: "O7f118C7xv98NmmozCry" },
    { url: "https://derpibooru.org", api_key: "9M1w8_78e5WkDPY9zck9" },
]

async function send_req(booru_url: string, api_key: string, image_url: string) {
    try {
        const link = `${booru_url}/api/v1/json/search/reverse?key=${api_key}&url=${image_url}`
        const response = await axios.post(link);
        return { booru_url, data: response.data }
    } catch (err) {
        return { booru_url, data: "error" }
    }
}

interface ResponseObj{
    [key: string]: string;
}
async function send_req_to_boorus(image_url: string) {
    const arr = []
    for (const booru of boorus) {
        arr.push(send_req(booru.url, booru.api_key, image_url))
    }
    const x = await Promise.allSettled(arr)
    const response_obj:ResponseObj = {}
    for (const item of x) {
        if(item.status==="fulfilled"){
            response_obj[item.value.booru_url] = item.value.data
        }
    }
    return response_obj
}

function isValidURL(url: string) {
    const RegExp = /^(?:(?:(?:https?):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?$/i
    if (RegExp.test(url)) {
        return true;
    } else {
        return false;
    }
}

function get_random_hex(size: number) {
    const result = [];
    const hexRef = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];
    for (let n = 0; n < size; n++) {
        result.push(hexRef[Math.floor(Math.random() * 16)]);
    }
    return result.join('');
}

async function reverse_search_global(req: Request, res: Response) {
    const image_url = req.query.url?.toString()
    if (req.file) {
        console.log(req.file)
        const image_id = get_random_hex(8)
        temp_images.set(image_id, req.file)
        const url = `${config.api_domain}/image/${image_id}`
        const response_obj = await send_req_to_boorus(url)
        temp_images.delete(image_id)
        res.json(response_obj)
    } else {
        if (!image_url || !isValidURL(image_url)) {
            return res.json({ message: "url is not valid" })
        }
        console.log(image_url)
        const response_obj = await send_req_to_boorus(image_url)
        res.json(response_obj)
    }
}

export default reverse_search_global;