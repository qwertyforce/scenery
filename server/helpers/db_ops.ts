import { MongoClient } from 'mongodb'
import crypto from "crypto"
import config from '../../config/config'
const url = config.mongodb_url
const db_main = 'Scenery'
const client = new MongoClient(url)
client.connect(function (err) {
    if (err) {
        console.log(err)
    } else {
        console.log("Connected successfully to db server")
    }
});
//////////////////////////////////////////////////////////////////////////////////////////////////
interface User {
    id: string,
    isAdmin: boolean,
    activated: boolean,
    password?: string,
    email?: string
}
interface NotActivatedUser {
    createdAt: Date,
    email: string,
    token: string,
    password: string,
    activated: false
}

interface PasswordRecoveryObject {
    createdAt: Date,
    user_id: string,
    token: string,
}

interface Image {
    id: number,
    created_at: Date,
    description: string
    source_url: string,
    file_ext: string,
    width: number,
    height: number,
    author: string,
    size: number,
    tags: Array<string>,
    sha256: string,
}
//////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////COLLECTIONS
const IMAGES_COLLECTION = client.db(db_main).collection("images")
const USERS_COLLECTION = client.db(db_main).collection("users")
const NOT_ACTIVATED_USERS_COLLECTION = client.db(db_main).collection("not_activated_users")
const PASSWORD_RECOVERY_COLLECTION = client.db(db_main).collection("password_recovery")
////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////////////////////////CREATE INDEXES
client.db(db_main).collection("images").createIndex({ "id": 1 }, { unique: true })
client.db(db_main).collection("images").createIndex({ "sha256": 1 }, { unique: true })
client.db(db_main).collection("images").createIndex({ "tags": 1 })
client.db(db_main).collection("not_activated_users").createIndex({ "createdAt": 1 }, { expireAfterSeconds: 86400 })
client.db(db_main).collection("password_recovery").createIndex({ "createdAt": 1 }, { expireAfterSeconds: 86400 })
////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function generate_id() {
    const id: Promise<string> = new Promise((resolve, reject) => {
        crypto.randomBytes(32, async function (ex, buffer) {
            if (ex) {
                reject("error");
            }
            const id = buffer.toString("base64").replace(/\/|=|[+]/g, '')
            const user = await find_user_by_id(id) //check if id exists
            if (!user) {
                resolve(id)
            } else {
                const id_1 = await generate_id()
                resolve(id_1)
            }
        });
    });
    return id;
}

/////////////////////////////////////////////////////////////////////////////////////IMAGES OPS
async function get_number_of_images_returned_by_search_query(query: Record<string, unknown>) {
    return IMAGES_COLLECTION.countDocuments(query)
}

async function batch_find_images(query: Record<string, unknown>, skip: number, limit: number) {
    const data: Promise<Image[]> = IMAGES_COLLECTION.find(query).sort({ "$natural": -1 }).skip(skip).limit(limit).project({ _id: 0 }).toArray()
    return data
}

async function check_if_image_exists_by_id(id: number) {
    return Boolean(await IMAGES_COLLECTION.countDocuments({ id: id }, { limit: 1 }))
}

async function set_tags_to_image_by_id(id: number, tags: string[]) {
    await IMAGES_COLLECTION.updateOne({ id: id }, { $set: { tags: tags } })
}

async function add_tags_to_image_by_id(id: number, tags: string[]) {
    await IMAGES_COLLECTION.updateOne({ id: id }, { $addToSet: { tags: { $each: tags } } })
}

async function update_image_data_by_id(id: number, update: Record<string, unknown>) {
    return IMAGES_COLLECTION.updateOne({ id: id }, { $set: update })
}

async function get_all_images() {
    const imgs: Promise<Image[]> = IMAGES_COLLECTION.find({}).project({ _id: 0 }).toArray()
    return imgs
}

async function get_image_file_extension_by_id(id: number) {
    const img = IMAGES_COLLECTION.find({ id: id }).project({ file_ext: 1, _id: 0 }).next()
    return img
}


async function find_image_by_sha256(hash: string) {
    const img: Promise<Image | null> = IMAGES_COLLECTION.find({ sha256: hash }).project({ _id: 0 }).next()
    return img
}
async function find_image_by_id(id: number) {
    const img: Promise<Image | null> = IMAGES_COLLECTION.find({ id: id }).project({ _id: 0 }).next()
    return img
}

async function get_max_image_id() {
    const result: Image | null = await IMAGES_COLLECTION.find({}).sort({ id: -1 }).limit(1).next()
    return result?.id || 0
}
async function delete_image_by_id(id: number) {
    return IMAGES_COLLECTION.deleteOne({ id: id })
}

async function add_image(img: Image) {
    const image = {
        id: img.id,
        file_ext: img.file_ext,
        created_at: img.created_at,
        width: img.width,
        height: img.height,
        author: img.author,
        description: img.description,
        size: img.size,
        sha256: img.sha256,
        tags: img.tags,
        source_url: img.source_url
    }
    IMAGES_COLLECTION.insertOne(image)
}
async function add_image_by_object(image: Record<string, unknown>) {
    return IMAGES_COLLECTION.insertOne(image)
}

async function get_number_of_unique_tags() {
    return (await IMAGES_COLLECTION.distinct("tags")).length
}

async function get_number_of_unique_authors() {
    return (await IMAGES_COLLECTION.distinct("author")).length
}

async function get_tags_stats() {
    const x = IMAGES_COLLECTION.aggregate([
        { $unwind: "$tags" },
        {
            $group: {
                _id: { $toLower: '$tags' },
                count: { $sum: 1 }
            }
        },
        {
            $sort: { _id: 1 }
        }
    ]);
    return x.toArray()
}

async function get_image_tags_by_id(image_id: number) {
    const data = IMAGES_COLLECTION.find({ id: image_id }).project({ _id: 0, tags: 1 }).next()
    return data
}
async function get_images_with_similar_tags(image_id: number, limit: number) {
    const target_tags = (await get_image_tags_by_id(image_id))?.tags
    if (!target_tags) {
        return []
    }
    const x = IMAGES_COLLECTION.aggregate([
        { $unwind: "$tags" },
        { $match: { tags: { $in: target_tags } } },
        { $group: { _id: { id: "$id", height: "$height", width: "$width" }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: limit }
    ]);
    return x.toArray()
}
/////////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////////////PASSWORD RECOVERY
async function update_user_password_by_id(id: string, password: string): Promise<void> {
    USERS_COLLECTION.updateOne({ id: id }, { $set: { password: password } })
}

async function delete_password_recovery_token(token: string): Promise<void> {
    PASSWORD_RECOVERY_COLLECTION.deleteOne({ token: token })
}

async function save_password_recovery_token(token: string, user_id: string): Promise<void> {
    PASSWORD_RECOVERY_COLLECTION.insertOne({
        createdAt: new Date(),
        token: token,
        user_id: user_id,
    })
}

async function find_user_id_by_password_recovery_token(token: string) {
    const user: Promise<PasswordRecoveryObject | null> = PASSWORD_RECOVERY_COLLECTION.find({ token: token }).limit(1).project({ _id: 0 }).next()
    return user
}
////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////////ACTIVATED USER
async function check_if_user_exists_by_id(id: string) {
    return Boolean(await USERS_COLLECTION.countDocuments({ id: id }, { limit: 1 }))
}

async function check_if_user_exists_by_email(email: string) {
    return Boolean(await USERS_COLLECTION.countDocuments({ email: email }, { limit: 1 }))
}


async function find_user_by_email(email: string) {
    const user: Promise<User | null> = USERS_COLLECTION.find({ email: email }).limit(1).project({ _id: 0 }).next()
    return user
}

async function find_user_by_oauth_id(oauth_id: string) {
    const user: Promise<User | null> = USERS_COLLECTION.find({ oauth_id: oauth_id }).limit(1).project({ _id: 0 }).next()
    return user
}

async function find_user_by_id(id: string) {
    const user: Promise<User | null> = USERS_COLLECTION.find({ id: id }).limit(1).project({ _id: 0 }).next()
    return user
}

async function create_new_user_activated(email: string, pass: string) {
    const id = await generate_id()
    const user = {
        email: email,
        id: id,
        password: pass,
        username: "",
        activated: true
    }
    USERS_COLLECTION.insertOne(user)
}


async function create_new_user_activated_github(oauth_id: string) {
    const id = await generate_id()
    USERS_COLLECTION.insertOne({
        oauth_id: oauth_id,
        id: id,
        username: "",
        activated: true
    })
    return id
}

async function create_new_user_activated_google(oauth_id: string, email: string) {
    const id = await generate_id()
    USERS_COLLECTION.insertOne({
        oauth_id: oauth_id,
        email_google: email,
        id: id,
        username: "",
        activated: true
    })
    return id
}
//////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////NOT ACTIVATED USER
async function find_not_activated_user_by_token(token: string) {
    const user: Promise<NotActivatedUser | null> = NOT_ACTIVATED_USERS_COLLECTION.find({ token: token }).limit(1).project({ _id: 0 }).next()
    return user
}

async function delete_not_activated_user_by_token(token: string) {
    NOT_ACTIVATED_USERS_COLLECTION.deleteOne({ token: token })
}

async function create_new_user_not_activated(email: string, pass: string, token: string) {
    NOT_ACTIVATED_USERS_COLLECTION.insertOne({
        createdAt: new Date(),
        email: email,
        token: token,
        password: pass,
        activated: false
    })
}
////////////////////////////////////////////////////////////////////////////////
// async function test(){
//     const x =await find_image_by_id(3)
//     console.log(x)
// }
// test()
export default {
    image_ops: {
        get_tags_stats,
        set_tags_to_image_by_id,
        get_images_with_similar_tags,
        get_number_of_unique_tags,
        get_number_of_unique_authors,
        get_number_of_images_returned_by_search_query,
        batch_find_images,
        add_image,
        add_image_by_object,
        get_all_images,
        find_image_by_id,
        get_max_image_id,
        delete_image_by_id,
        get_image_file_extension_by_id,
        find_image_by_sha256,
        check_if_image_exists_by_id,
        update_image_data_by_id,
        add_tags_to_image_by_id,
    },
    password_recovery: {
        update_user_password_by_id,
        delete_password_recovery_token,
        save_password_recovery_token,
        find_user_id_by_password_recovery_token
    },
    activated_user: {
        check_if_user_exists_by_id,
        check_if_user_exists_by_email,
        find_user_by_email,
        find_user_by_oauth_id,
        find_user_by_id,
        create_new_user_activated,
        create_new_user_activated_github,
        create_new_user_activated_google,
    },
    not_activated_user: {
        find_not_activated_user_by_token,
        delete_not_activated_user_by_token,
        create_new_user_not_activated
    }
}