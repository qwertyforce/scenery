/* eslint-disable @typescript-eslint/no-non-null-assertion */
import db_ops from './../helpers/db_ops'
import {Request, Response} from 'express';

async function update_image_data(req:Request,res:Response) {
    const image_data = req.body.image_data;
    if(req.session?.user_id){
        const user = await db_ops.activated_user.find_user_by_id(req.session?.user_id)
        if(user[0].isAdmin){
            delete image_data["_id"]
            db_ops.image_ops.update_image_data_by_id(image_data.id,image_data)
            res.json({message:"OK"})
            return 
        }
    }
    res.sendStatus(404);
}

export default update_image_data;