import db_ops from './../helpers/db_ops'
import image_ops from './../helpers/image_ops'
import { Request, Response } from 'express';
import config from '../../config/config'
import fs from 'fs'
async function delete_image(req: Request, res: Response) {
    const id = parseInt(req.body.id);
    if (!isNaN(id) && req.session?.user_id) {
        const user = await db_ops.activated_user.find_user_by_id(req.session?.user_id)
        if (user.isAdmin) {
            const image = await db_ops.image_ops.find_image_by_id(id)
            if (image) {
                await image_ops.delete_image_features(id)
                await db_ops.image_ops.delete_image_by_id(id)
                fs.unlink(`${config.root_path}/public/images/${id}.${image.file_ext}`, function (err) {
                    if (err) return console.log(err);
                    console.log('main image deleted successfully');
                });
                fs.unlink(`${config.root_path}/public/thumbnails/${id}.jpg`, function (err) {
                    if (err) return console.log(err);
                    console.log('thumbnail file deleted successfully');
                });
                fs.unlink(`${config.root_path}/public/upscaled/${id}.png`, function (err) {
                    if (err) return console.log(err);
                    console.log('upscaled file deleted successfully');
                });
                res.json({ message: "OK" })
            } else {
                res.json({ message: "image not found" })
            }
            return
        }
    }
    res.sendStatus(404);
}

export default delete_image;