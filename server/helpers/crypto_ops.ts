/* eslint-disable @typescript-eslint/no-var-requires */
import bcrypt from "bcrypt"
import crypto from "crypto"
import db_ops from "./db_ops"
const cryptoAsync = require('@ronomon/crypto-async');
const SALTROUNDS = 10

async function generate_activation_token(): Promise<string> {
    return new Promise((resolve, reject) => {
        crypto.randomBytes(16, async function (ex, buffer) {
            if (ex) {
                reject("error");
            }
            const token = buffer.toString("base64").replace(/\/|=|[+]/g, '')
            const users = await db_ops.not_activated_user.find_not_activated_user_by_token(token) //check if token exists
            if (users.length === 0) {
                resolve(token);
            } else {
                const token_1 = await generate_activation_token()
                resolve(token_1)
            }
        });
    });
}

async function generate_password_recovery_token(): Promise<string> {
    return new Promise((resolve, reject) => {
        crypto.randomBytes(16, async function (ex, buffer) {
            if (ex) {
                reject("error");
            }
            const token = buffer.toString("base64").replace(/\/|=|[+]/g, '')
            const user_id = await db_ops.password_recovery.find_user_id_by_password_recovery_token(token) //check if token exists
            if (user_id.length === 0) {
                resolve(token);
            } else {
                const token_1 = await generate_password_recovery_token()
                resolve(token_1)
            }
        });
    });
}

async function hash_password(password: string): Promise<string> {
    const hashed_pass = bcrypt.hash(password, SALTROUNDS);
    return hashed_pass
}

async function check_password(password: string, hash: string): Promise<boolean> {
    const result = bcrypt.compare(password, hash);
    return result
}
async function image_buffer_sha512_hash(image_buffer:Buffer){
    return cryptoAsync.hash("sha512",image_buffer).toString('hex')
}

export default {generate_activation_token,generate_password_recovery_token,hash_password,check_password,image_buffer_sha512_hash}