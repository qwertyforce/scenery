/* eslint-disable @typescript-eslint/no-var-requires */
import fs from 'fs'
import path from 'path'
const imghash: any = require('imghash');

// const PATH_TO_IMAGES = path.join("..", "..", "..", 'import_from_derpi', 'images')
const PATH_TO_IMAGES = path.join("D:", "derpi_downloader", 'Downloads', 'derpi2')
const IMAGES = fs.readdirSync(PATH_TO_IMAGES)




function hamming_distance(str1: string, str2: string) {
    // if (str1.length !== str2.length) {
    //     console.log("Length must be the same")
    //     return
    // }
    let distance = 0;
    for (let i = 0; i < str1.length; i += 1) {
        if (str1[i] !== str2[i]) {
            distance += 1;
        }
    }
    return distance;
}
async function find_duplicates() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hashes: { [key: string]: any } = {};
    for (const image_file_name of IMAGES) {
        // console.log(IMAGES.indexOf(image_file_name))

        try {
            const phash = await imghash.hash(`${PATH_TO_IMAGES}/${image_file_name}`, 16);
            for (const hash of Object.keys(hashes)) {
                const distance = hamming_distance(hash, phash)
                if (distance < 20) {
                    console.log("===========")
                    console.log(distance)
                    console.log(`${image_file_name} is a duplicate of ${hashes[hash]}`)
                    console.log("===========")
                    continue
                }
            }
            hashes[phash] = image_file_name
        } catch (err) {
            console.log(err)
            console.log(image_file_name)
        }
    }
}
find_duplicates()

