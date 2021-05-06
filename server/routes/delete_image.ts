import db_ops from './../helpers/db_ops'
import image_ops from './../helpers/image_ops'
import { Request, Response } from 'express';
async function delete_image(req: Request, res: Response) {
    const id = parseInt(req.body.id);
    if (!isNaN(id) && req.session?.user_id) {
        const user = await db_ops.activated_user.find_user_by_id(req.session?.user_id)
        if (user.isAdmin) {
            const result = await image_ops.delete_image(id)
            if (result === "not_found") {
                return res.json({ message: "image not found" })
            }
            if (result) {
                res.json({ message: "OK" })
            } else {
                res.json({ message: "unknown error" })
            }
        }
    } else {
        res.sendStatus(404);
    }
}

export default delete_image;