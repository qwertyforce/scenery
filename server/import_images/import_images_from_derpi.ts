/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-var-requires */
import db_ops from "../helpers/db_ops"
import fs from 'fs'
import path from 'path'
const { COPYFILE_EXCL } = fs.constants;

const imghash: any = require('imghash');



const PATH_TO_IMAGES = path.join("..", "..", "..", 'import_from_derpi', 'images')
const PATH_TO_JSONS = path.join("..", "..", "..", 'import_from_derpi', 'jsons')
const PATH_TO_IMPORTED_IMAGES = path.join("..", "..", "..", 'public', 'images')
const IMAGES = fs.readdirSync(PATH_TO_IMAGES)

const JSONS = fs.readdirSync(PATH_TO_JSONS).map(json_file_name => path.parse(json_file_name).name)
const NO_AUTHOR_NAME_FOUND = 1

async function parse_author(tags: any) {
    for (const tag of tags) {
        const idx = tag.indexOf("artist:")
        if (idx === 0) {    //tag starts with "artist:" 
            return tag.slice(7) //strip off "artist:" 
        }
    }
    return NO_AUTHOR_NAME_FOUND
}
function callback(err: any) {
    if (err) throw err;
  }
async function import_images() {
    console.log("Getting last image id...")
    let id = await db_ops.image_ops.find_max_image_id()
    if (!id) {
        id = 0
    }
    console.log(`Last image id: ${id}`)
    for (const image_file_name of IMAGES) {
        if (JSONS.includes(path.parse(image_file_name).name)) {
            console.log(`importing ${image_file_name}`)
            const json_file_path = path.join(PATH_TO_JSONS, path.parse(image_file_name).name + ".json")
            const derpi_data = JSON.parse(fs.readFileSync(json_file_path, 'utf8'))
            const images_with_same_sha512 = await db_ops.image_ops.find_image_by_sha512(derpi_data.sha512_hash)
            if (images_with_same_sha512.length !== 0) {
                // console.log("Duplicate (SHA-512)")
                continue;
            }
            let parsed_author = await parse_author(derpi_data.tags)
            if (parsed_author === NO_AUTHOR_NAME_FOUND) {
                console.log("No author found")
                parsed_author="???"
            }
            const derpi_link = "https://derpibooru.org/images/" + derpi_data.id
            const phash = await imghash.hash(`${PATH_TO_IMAGES}/${image_file_name}`, 16);
            id++
            fs.copyFile(`${PATH_TO_IMAGES}/${image_file_name}`, `${PATH_TO_IMPORTED_IMAGES}/${id}.${derpi_data.format.toLowerCase()}`, COPYFILE_EXCL,callback )
            console.log(`imported ${image_file_name}`)
            db_ops.image_ops.add_image(id, derpi_data.format.toLowerCase(), derpi_data.width, derpi_data.height, parsed_author, derpi_data.size,
                derpi_link, derpi_data.upvotes, derpi_data.downvotes, derpi_data.id, derpi_data.created_at,
                derpi_data.source_url, derpi_data.tags, derpi_data.wilson_score, derpi_data.sha512_hash, phash,derpi_data.description)

        }
    }
    process.exit()

}
import_images()
