import {MongoClient} from 'mongodb'
import crypto from "crypto"
const url = 'mongodb://localhost/';
const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true
};
const db_main = 'Scenery';
const client = new MongoClient(url, options);
client.connect(function(err) {
    if (err) {
        console.log(err)
    } else {
        console.log("Connected successfully to db server");
    }
});
client.db(db_main).listCollections({
    name: "not_activated_users"
}).toArray().then(function(items) {
    if (items.length === 0) {
        client.db(db_main).collection("not_activated_users").createIndex({
            "createdAt": 1
        }, {
            expireAfterSeconds: 86400
        });
    }
});

client.db(db_main).listCollections({
    name: "password_recovery"
}).toArray().then(function(items) {
    if (items.length === 0) {
        client.db(db_main).collection("password_recovery").createIndex({
            "createdAt": 1
        }, {
            expireAfterSeconds: 86400
        });
    }
});

async function findDocuments(collection_name:string, selector:Record<string,unknown>) {
    const collection = client.db(db_main).collection(collection_name);
    const result = collection.find(selector).toArray()
    return result
}
async function removeDocument(collection_name:string, selector:Record<string,unknown>) {
    const collection = client.db(db_main).collection(collection_name);
    collection.deleteOne(selector)
}

async function insertDocuments(collection_name:string, documents:Array<any>) {
    const collection = client.db(db_main).collection(collection_name);
    collection.insertMany(documents)
    // const result = await collection.insertMany(documents);
    // return result
}
async function updateDocument(collection_name:string,selector:Record<string,unknown>,update:Record<string,unknown>) {
  const collection = client.db(db_main).collection(collection_name);
  collection.updateOne(selector, { $set: update })
  //const result= await collection.updateOne(selector, { $set: update })
 // console.log(result)
}
async function addToArrayInDocument(collection_name:string,selector:Record<string,unknown>,update:Record<string,unknown>) {
    const collection = client.db(db_main).collection(collection_name);
    const result = collection.updateOne(selector, { $push: update })
    return result
}

// async function removeFromArrayInDocument(collection_name:string,selector:object,update:object) {
//     const collection = client.db(db_main).collection(collection_name);
//     const result = collection.updateOne(selector, { $pull: update })
//     return result
// }


async function generate_id() {
    const id = new Promise((resolve, reject) => {
        crypto.randomBytes(32, async function(ex, buffer) {
            if (ex) {
                reject("error");
            }
            const id = buffer.toString("base64").replace(/\/|=|[+]/g, '')
            const users = await find_user_by_id(id) //check if id exists
            if (users.length === 0) {
                resolve(id);
            } else {
                const id_1 = await generate_id()
                resolve(id_1)
            }
        });
    });
    return id;
}
/////////////////////////////////////////////////IMAGE SEARCH OPS
async function get_all_phash_distances(){
    const phash_distances = findDocuments("img_search", {})
    return phash_distances
}
async function get_phash_distances_by_image_id(id:number){
    const phash_distances = findDocuments("img_search", {id:id})
    return phash_distances
}

async function add_image_to_image_search(id:number, phash_dist:Array<Record<string,unknown>>){
    insertDocuments("img_search", [{
        id:id,
        phash_dist:phash_dist
    }])
}
async function update_phash_dist_by_id(id:number, phash_dist:Array<Record<string,unknown>>){
    updateDocument("images", {id: id},{phash_dist:phash_dist})
}

////////////////////////////////////////////////


/////////////////////////////////////////////////IMAGES OPS

async function add_tags_to_image_by_id(id:number,tags:string[]){
    await addToArrayInDocument("images",{id:id},{tags:{ $each:tags}})
}

async function get_ids_and_phashes(){
    const collection = client.db(db_main).collection("images");
    const data = collection.aggregate([{ $project : { id : 1, phash : 1,_id : 0} }]).toArray()
    return data
}

async function update_image_data_by_id(id:number,update:Record<string,unknown>){
    updateDocument("images", {id: id},update)
}

async function get_all_images(){
    const imgs = findDocuments("images", {})
    return imgs
}

async function find_images_by_tags(include_tags:Array<string>,exclude_tags:Array<string>){
    const imgs = findDocuments("images", { $and: [
        { tags: { $all: include_tags } }, 
        { tags: { $not: { $all: exclude_tags }}}
    ] })
    return imgs
}
async function find_image_by_sha512(hash:string){
    const img = findDocuments("images", {
        sha512: hash
    })
    return img
}
async function find_image_by_id(id:number){
    const img = findDocuments("images", {
        id: id
    })
    return img
}
async function find_image_by_phash(hash:string){
    const img = findDocuments("images", {
        phash: hash
    })
    return img
}

async function get_max_image_id(){
    const collection = client.db(db_main).collection("images");
    const result = await collection.find({}).sort({id:-1}).limit(1).toArray()
    return result[0]?.id
}

async function add_image(id:number,file_ext:string,width:number,height:number,author:string,
    size:string,derpi_link:string,
    derpi_likes:number,derpi_dislikes:number,
    derpi_id:number,derpi_date:Date,source_url:string,tags:Array<string>,wilson_score:number,sha512:string,phash:string,description:string){
    insertDocuments("images", [{
        id:id,
        file_ext:file_ext,
        created_at: new Date(),
        width:width,
        height:height,
        author: author,
        description:description,
        size:size,
        phash:phash,
        sha512:sha512,
        tags:tags,
        derpi_id:derpi_id,
        derpi_likes:derpi_likes,
        derpi_dislikes:derpi_dislikes,
        derpi_link:derpi_link,
        derpi_date:derpi_date,
        source_url:source_url,
        wilson_score:wilson_score
    }])
}
/////////////////////////////////////////////////////////

////////////////////////////////////////PASSWORD RECOVERY
async function update_user_password_by_id(id:string,password:string):Promise<void> {
    updateDocument("users", {id: id},{password:password})
}

async function delete_password_recovery_token(token:string):Promise<void> {
    removeDocument("password_recovery", {
        token: token
    })
}

async function save_password_recovery_token(token:string, user_id:string):Promise<void> {
    insertDocuments("password_recovery", [{
        "createdAt": new Date(),
        token: token,
        user_id: user_id,
    }])
}

async function find_user_id_by_password_recovery_token(token:string) {
    const user = findDocuments("password_recovery", {
        token: token
    })
    return user
}
//////////////////////////////////////////

//////////////////////////////////////////ACTIVATED USER

async function find_user_by_email(email:string) {
    const user = findDocuments("users", {
        email: email
    })
    return user
}

async function find_user_by_oauth_id(oauth_id:string) {
    const user = findDocuments("users", {
        oauth_id: oauth_id
    })
    return user
}

 async function find_user_by_id(id:string) {
    const user = findDocuments("users", {
        id: id
    })
    return user
}

async function create_new_user_activated(email:string, pass:string) {
    const id=await generate_id()
    insertDocuments("users", [{
        email: email,
        id: id,
        password: pass,
        username:"",
        links:0,
        activated: true
    }])
}


async function create_new_user_activated_github(oauth_id:string) {
    const id=await generate_id()
    insertDocuments("users", [{
        oauth_id: oauth_id,
        id: id,
        username:"",
        links:0,
        activated: true
    }])
    return id
}

async function create_new_user_activated_google(oauth_id:string,email:string) {
    const id=await generate_id()
    insertDocuments("users", [{
        oauth_id: oauth_id,
        email_google:email,
        id: id,
        username:"",
        links:0,
        activated: true
    }])
    return id
}
/////////////////////////////////////////////////////////


//////////////////////////////////////////NOT ACTIVATED USER
async function find_not_activated_user_by_token(token:string) {
    const user = findDocuments("not_activated_users", {
        token: token
    })
    return user
}

async function delete_not_activated_user_by_token(token:string) {
    removeDocument("not_activated_users", {
        token: token
    })
}

async function create_new_user_not_activated(email:string, pass:string, token:string) {
    insertDocuments("not_activated_users", [{
        "createdAt": new Date(),
        email: email,
        token: token,
        password: pass,
        activated: false
    }])
}
/////////////////////////////////////////////////////////

export default {
    image_ops: {
        add_image,
        get_all_images,
        find_image_by_id,
        get_max_image_id,
        find_images_by_tags,
        get_ids_and_phashes,
        find_image_by_phash,
        find_image_by_sha512,
        add_tags_to_image_by_id,
        update_image_data_by_id
    },
    image_search:{
        get_all_phash_distances,
        update_phash_dist_by_id,
        add_image_to_image_search,
        get_phash_distances_by_image_id,  
    },
    password_recovery:{
        update_user_password_by_id,
        delete_password_recovery_token,
        save_password_recovery_token,
        find_user_id_by_password_recovery_token
    },
    activated_user:{
        find_user_by_email,
        find_user_by_oauth_id,
        find_user_by_id,
        create_new_user_activated,
        create_new_user_activated_github,
        create_new_user_activated_google,
    },
    not_activated_user:{
        find_not_activated_user_by_token,
        delete_not_activated_user_by_token,
        create_new_user_not_activated
    }
}