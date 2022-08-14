import { withEmotionCache } from "tss-react/nextJs"
import { createMuiCache } from "./_app"
import Document, { Html, Head, Main, NextScript } from 'next/document'
import theme from '../components/theme'


class MyDocument extends Document {
    render() {
      return (
        <Html lang="en">
          <Head>
            {/* PWA primary color */}
            <meta name="theme-color" content={theme.palette.primary.main} />
            <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" />
          </Head>
          <body>
            <Main />
            <NextScript />
            <script defer src={`https://www.google.com/recaptcha/api.js?render=${process.env.recaptcha_site_key}`}></script>
          </body>
        </Html>
      )
    }
  }

export default withEmotionCache({
    //If you have a custom document pass it instead
    "Document": MyDocument,
    //Every emotion cache used in the app should be provided.
    //Caches for MUI should use "prepend": true.
    "getCaches": ()=> [ createMuiCache() ]
});