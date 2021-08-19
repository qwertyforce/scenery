import path from "path"
const server_config = {
  domain: "http://localhost",
  recaptcha_secret_key: "6LcqV9QUAAAAAOA18kbCEWRBhF4g4LjSTaFRVe9P",
  GOOGLE_CLIENT_ID: "1006819405532-0tm9sghd6nvnpc3djf9pbrdppminbdjf.apps.googleusercontent.com",
  GOOGLE_CLIENT_SECRET: "7S3KdJSNRYwkfe47dHtrJO0M",
  GOOGLE_REDIRECT_URI: "http://localhost/auth/google/callback",
  GITHUB_CLIENT_ID: "d4f2879aafb5bfac8dec",
  GITHUB_CLIENT_SECRET: "a2b8462d6cefb17339f4b730578db280b65e84ad",
  GITHUB_REDIRECT_URI: "http://localhost/auth/github/callback",
  gmail_user: "auth.test.reg.email@gmail.com",
  gmail_password: "sbuLBh9rAV8XD2",
  mongodb_url: "mongodb://localhost/",
  server_port: "80",
  session_secret: "ghuieorifigyfuu9u3i45jtr73490548t7ht",
  root_path: path.join(__dirname, "..", ".."),
  deviant_art_client_id: "client_id",
  deviant_art_client_secret: "client_secret",
  ambience_microservice_url: "http://localhost:44444",
  use_backup_file_server: false,
  backup_file_server_url: "http://localhost:8787",
  optimize_images: true,
}
export default server_config