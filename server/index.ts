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
import { check } from 'express-validator';
import { RecaptchaV3 } from 'express-recaptcha'
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
////////////////////////////////////////////////////////ROUTE HANDLERS
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
import import_image from './routes/import_image'
import reverse_search_global from './routes/public_api/reverse_search_global'
import get_all_images from './routes/public_api/get_all_images'
import temp_image from './routes/public_api/temp_image'
////////////////////////////////////////////////////////
next_app.prepare().then(() => {
  const app = express()
  const storage = multer.memoryStorage()
  const upload_50MB = multer({ storage: storage,limits:{files:1,fileSize:50000000}})  //50MB
  const upload_150MB = multer({ storage: storage,limits:{files:1,fileSize:150000000}})  //150MB
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
  const limiter = rateLimit({
    windowMs: 15 * 60,  // 15 minutes
    max: 200 // limit each IP to w00 requests per windowMs
  });
  const cors_options = {
    "origin": config.domain,
    "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
    "preflightContinue": false,
    "optionsSuccessStatus": 204
  }
 ///////////////////////////////////////////////PUBLIC_API_ROUTER 
  const public_api_router=express.Router()
  public_api_router.use(cors());
 /////////////////////////////////////////////// 

  ///////////////////////////////////////PUBLIC_API
  public_api_router.get('/image/:image_id', temp_image)
  public_api_router.post('/reverse_search_global',[upload_50MB.single('image')], reverse_search_global)
  public_api_router.get('/get_all_images',get_all_images)
  /////////////////////////////////////////////////

//////////////////////////////////////////////////////////////AUTH AND PROFILE ACTIONS
  app.get('/auth/google', google_oauth_redirect)
  app.get('/auth/github', github_oauth_redirect)
  app.get('/auth/github/callback', github_oauth_callback)
  app.get('/auth/google/callback', google_oauth_callback)
  app.post('/login', [limiter,recaptcha.middleware.verify,check('email').isEmail(),check('password').isLength({min: PASS_MIN,max: PASS_MAX})], login)
  app.post('/signup', [limiter,recaptcha.middleware.verify,check('email').isEmail(),check('password').isLength({min: PASS_MIN,max: PASS_MAX})], signup)
  app.post('/change_pw', [limiter,recaptcha.middleware.verify,check('password').isLength({min: PASS_MIN,max: PASS_MAX})], change_password)
  app.post('/forgot_pw', [limiter,recaptcha.middleware.verify,check('email').isEmail()], forgot_password)
  app.get('/activate',[limiter], activate_account_email)
  app.get('/logout', (req, res) => {
    if (req.session) {
      req.session.destroy(function (err) {
        if (err) {
          console.log(err)
        }
        res.redirect(config.domain)
      });
    }
  })
///////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////////////////////ADMIN ONLY
  app.post('/update_image_data', update_image_data)
  app.post('/delete_image', delete_image)
  app.post('/import_from_derpi', import_from_derpi)
  app.post('/import_image',[upload_150MB.single('image')], import_image)
/////////////////////////////////////////////////////////////////////////////////////

  app.post('/reverse_search', [cors(cors_options),limiter,upload_50MB.single('image'),recaptcha.middleware.verify], reverse_search)
  app.post('/proxy_get_image', [limiter,check('image_url').isURL(),recaptcha.middleware.verify,], proxy_get_image)

  app.use("/public_api",public_api_router)

  app.all('*', (req, res) => {
    return handle(req, res)
  })

  app.set('trust proxy','127.0.0.1')
  app.listen(port,'localhost', () => {
    console.log(`> Ready on ${port}`)
  })
})