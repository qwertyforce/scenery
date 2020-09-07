import db_ops from "../helpers/db_ops"
import fs from 'fs'
import path from 'path'
import { imageHash } from 'image-hash'
const PATH_TO_IMAGES = path.join("..", "..", "..", 'import_from_derpi', 'images')
const PATH_TO_JSONS = path.join("..", "..", "..", 'import_from_derpi', 'jsons')
const IMAGES = fs.readdirSync(PATH_TO_IMAGES)
const JSONS = fs.readdirSync(PATH_TO_JSONS).map(json_file_name => path.parse(json_file_name).name)
const NO_AUTHOR_NAME_FOUND = 1
let id = 0
function parse_author(tags: any) {
    for (const tag of tags) {
        const idx = tag.indexOf("artist:")
        if (idx === 0) {    //tag starts with "artist:" 
            return tag.slice(7) //strip off "artist:" 
        }
    }
    return NO_AUTHOR_NAME_FOUND
}



for (const image_file_name of IMAGES) {
    console.log(JSONS)
    if (JSONS.includes(path.parse(image_file_name).name)) {
        ;
        id++
        console.log(`importing ${image_file_name}`)
        const json_file_path = path.join(PATH_TO_JSONS, path.parse(image_file_name).name + ".json")
        const derpi_data = JSON.parse(fs.readFileSync(json_file_path, 'utf8'))
        const parsed_author = parse_author(derpi_data.tags)
        if (parsed_author === NO_AUTHOR_NAME_FOUND) {
            console.log("No author found? skipping...")
            continue;
        }
        const derpi_link = "https://derpibooru.org/images/" + derpi_data.id
        imageHash(`${PATH_TO_IMAGES}/${image_file_name}`, 16, true, (error: string, phash: string) => {
            if (error) throw error;
            console.log(phash);
            db_ops.image_ops.add_image(id, derpi_data.width, derpi_data.height, parsed_author, derpi_data.size,
                derpi_link, derpi_data.upvotes, derpi_data.downvotes, derpi_data.id, derpi_data.created_at,
                derpi_data.source_url, derpi_data.tags, derpi_data.wilson_score, derpi_data.sha512_hash, phash)
        })
    }
}