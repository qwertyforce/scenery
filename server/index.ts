/* eslint-disable @typescript-eslint/no-explicit-any */
import fastify from 'fastify'
import formBodyPlugin from 'fastify-formbody'
import fastifyCookie from 'fastify-cookie'
import config from "./../config/config"
import MongoStore from 'connect-mongo'
import fastifyMultipart from 'fastify-multipart'
import fastifyCors from 'fastify-cors'
import fastifySession from 'fastify-session';
import fastifyRecaptcha from 'fastify-recaptcha'
import next from 'next'

const dev = process.env.NODE_ENV !== 'production'
const port = parseInt(process.env.NODE_PORT || config.server_port)
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
import reverse_search from './routes/reverse_search'
import proxy_get_image from './routes/proxy_get_image'
import import_image from './routes/import_image'
/////////////////////////////////////////////////////////////////////
function main() {
  const server = fastify({ trustProxy: true })
  server.register(formBodyPlugin)
  server.register(fastifyCookie);
  server.register(fastifySession, {
    secret: config.session_secret,
    cookieName: "session",
    rolling: false,
    cookie: {
      secure: process.env.NODE_ENV === "production" ? true : false, //use secure: true
      maxAge: 14 * 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    },
    store: new MongoStore({
      mongoUrl: config.mongodb_url + 'Scenery',
      ttl: 14 * 24 * 60 * 60
    }) // = 14 days. Default
  })

  server.register(fastifyMultipart, {
    attachFieldsToBody: true,
    sharedSchemaId: '#mySharedSchema',
    limits: {
      fieldNameSize: 100, // Max field name size in bytes
      fieldSize: 1000,     // Max field value size in bytes
      fields: 10,         // Max number of non-file fields
      fileSize: 50000000,  // For multipart forms, the max file size in bytes  //50MB
      files: 1,           // Max number of file fields
      headerPairs: 2000   // Max number of header key=>value pairs
    }
  });
  server.register(fastifyCors, {
    "origin": config.domain,
    "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
  })

  interface Body {
    [key: string]: any
  }
  server.addHook<{ Body: Body }>('preValidation', async (request) => {
    if (request.body && typeof request.body["g-recaptcha-response"]?.value === "string") {
      request.body["g-recaptcha-response"] = request.body["g-recaptcha-response"].value
    }
  })

  server.register(fastifyRecaptcha, {
    recaptcha_secret_key: config.recaptcha_secret_key,
    reply: true
  })

  //////////////////////////////////////////////////////////////AUTH AND PROFILE ACTIONS
  server.get('/auth/google', google_oauth_redirect)
  server.get('/auth/github', github_oauth_redirect)
  server.get('/auth/github/callback', github_oauth_callback)
  server.get('/auth/google/callback', google_oauth_callback)
  server.post('/login', login)
  server.post('/signup', signup)
  server.post('/change_pw', change_password)
  server.post('/forgot_pw', forgot_password)
  server.get('/activate', activate_account_email)
  ///////////////////////////////////////////////////////////////

  /////////////////////////////////////////////////////////////////////////////////////ADMIN ONLY
  server.post('/update_image_data', update_image_data)
  server.post('/delete_image', delete_image)
  server.post('/import_image', import_image)
  /////////////////////////////////////////////////////////////////////////////////////

  server.post('/reverse_search', reverse_search)
  server.post('/proxy_get_image', proxy_get_image)

  server.get('/logout', (req, res) => {
    if (req.session) {
      req.destroySession(function (err: any) {
        if (err) {
          console.log(err)
        }
        res.redirect(config.domain)
      });
    }
  })

  server.all('/*', (req: any, reply) => {
    req.raw.session = req.session
    return handle(req.raw, reply.raw).then(() => {
      reply.sent = true
    })
  })
  // Run the server!
  server.listen(port, "127.0.0.1", function (err, address) {
    if (err) {
      console.error(err)
      process.exit(1)
    }
    server.log.info(`server listening on ${address}`)
  })
}
next_app.prepare().then(() => main())