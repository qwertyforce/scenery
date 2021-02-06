import express from 'express'
import next from 'next'
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import connectMongo from 'connect-mongo';
const MongoStore = connectMongo(session);
import rateLimit from "express-rate-limit";
import cors from 'cors';
import multer from 'multer'
import mongoSanitize  from 'express-mongo-sanitize'
//import https from 'https';
//import path from 'path';
import { check } from 'express-validator';
import { RecaptchaV3 } from 'express-recaptcha'
//import fs from 'fs';
import config from '../config/config'
declare module "express-session" {
  interface Session {
    user_id: string,
    authed: boolean
  }
}
const PASS_MIN = 8;
const PASS_MAX = 128;
const port = parseInt(process.env.NODE_PORT||config.server_port)
const dev = process.env.NODE_ENV !== 'production'
const next_app = next({ dev })
const handle = next_app.getRequestHandler()
//////////////////ROUTE HANDLERS
import google_oauth_redirect from './routes/google_oauth_redirect';
import github_oauth_redirect from './routes/github_oauth_redirect';
import github_oauth_callback from './routes/github_oauth_callback';
import google_oauth_callback from './routes/google_oauth_callback';
import signup from './routes/signup';
import login from './routes/login';
import change_password from './routes/change_password';
import forgot_password from './routes/forgot_password';
import activate_account_email from './routes/activate_account_email';
import update_image_data from './routes/update_image_data'
import delete_image from './routes/delete_image'
import import_from_derpi from './routes/import_from_derpi'
import reverse_search from './routes/reverse_search'
import proxy_get_image from './routes/proxy_get_image'
import reverse_search_global from './routes/reverse_search_global'
import temp_image from './routes/temp_image'
next_app.prepare().then(() => {
  const app = express()
  const storage = multer.memoryStorage()
  const upload = multer({ storage: storage,limits:{files:1,fileSize:50000000}})  //50MB
  const recaptcha = new RecaptchaV3(config.recaptcha_site_key, config.recaptcha_secret_key);
  app.use(function (_req, res, next) {
    res.setHeader('X-Content-Type-Options', "nosniff")
    res.setHeader('X-Frame-Options', "Deny")  //clickjacking protection
    next();
  });
  app.use(bodyParser.urlencoded({
    extended: true
  }));
  app.use(bodyParser.json());
  app.disable('x-powered-by');
  app.use(cookieParser());
  app.use(session({
    secret: config.session_secret,
    resave: false,
    saveUninitialized: true,
    name: "session",
    cookie: {
      maxAge: 14 * 24 * 60 * 60 * 1000,              //use secure: true
      sameSite: 'lax'
    },
    store: new MongoStore({
      url: config.mongodb_url+'Scenery',
      ttl: 14 * 24 * 60 * 60
    }) // = 14 days. Default
  }))
  app.use(mongoSanitize());
  ///////////////////////////////////////////////PRIVATE_API_ROUTER 
  const api_router=express.Router()
  const limiter = rateLimit({
    windowMs: 15 * 60,  // 15 minutes
    max: 200 // limit each IP to w00 requests per windowMs
  });
  const cors_options = {
    "origin": config.domain,
    "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
    "credentials": true,
    "preflightContinue": false,
    "optionsSuccessStatus": 204
  }
  api_router.use(cors(cors_options));
  api_router.use(limiter);
  app.use(api_router)
 /////////////////////////////////////////////// 

 ///////////////////////////////////////////////PUBLIC_API_ROUTER 
  const public_api_router=express.Router()
  public_api_router.use(cors())
  app.use(public_api_router)
 /////////////////////////////////////////////// 

  ///////////////////////////////////////PUBLIC_API
  // public_api_router.get('/api/reverse_search_global', reverse_search_global)
  public_api_router.get('/public_api/image/:image_id', temp_image)
  public_api_router.post('/public_api/reverse_search_global',[upload.single('image')], reverse_search_global)
  ///////////////////////////////////////
  
  api_router.get('/auth/google', google_oauth_redirect)
  api_router.get('/auth/github', github_oauth_redirect)
  api_router.get('/auth/github/callback', github_oauth_callback)
  api_router.get('/auth/google/callback', google_oauth_callback)

  api_router.post('/reverse_search', [upload.single('image'),recaptcha.middleware.verify], reverse_search)

  api_router.post('/update_image_data', update_image_data)
  api_router.post('/delete_image', delete_image)
  api_router.post('/import_from_derpi', import_from_derpi)

  api_router.post('/proxy_get_image', [
    recaptcha.middleware.verify,
    check('image_url').isURL(),
  ], proxy_get_image)

  api_router.post('/signup', [
    recaptcha.middleware.verify,
    check('email').isEmail(),
    check('password').isLength({
      min: PASS_MIN,
      max: PASS_MAX
    })
  ], signup)

  api_router.post('/login', [
    recaptcha.middleware.verify,
    check('email').isEmail(),
    check('password').isLength({
      min: PASS_MIN,
      max: PASS_MAX
    }),
  ], login)

  api_router.post('/change_pw', [
    recaptcha.middleware.verify,
    check('password').isLength({
      min: PASS_MIN,
      max: PASS_MAX
    }),
  ], change_password)

  api_router.post('/forgot_pw', [
    recaptcha.middleware.verify,
    check('email').isEmail(),
  ], forgot_password)

  api_router.get('/activate', activate_account_email)
  api_router.get('/logout', (req, res) => {
    if (req.session) {
      req.session.destroy(function (err) {
        if (err) {
          console.log(err)
        }
        res.redirect(config.domain)
      });
    }
  })

  app.all('*', (req, res) => {
    return handle(req, res)
  })
  app.set('trust proxy','127.0.0.1')
  app.listen(port,'localhost', () => {
    console.log(`> Ready on ${port}`)
  })
})