import Document, { Html, Head, Main, NextScript } from 'next/document'
import { ServerStyleSheets } from '@material-ui/core/styles'
import theme from '../components/theme'
import CleanCSS from "clean-css"
import { Children } from 'react'
const cleanCSS = new CleanCSS({
  level: {
    1: {},
    2: {}
  }
})
const minified_css_cache = new Map()

export default class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          {/* PWA primary color */}
          <meta name="theme-color" content={theme.palette.primary.main} />
          <link rel='preconnect' href='https://fonts.gstatic.com' crossOrigin="anonymous" />
          <link rel="preload" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" as="style" />
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

// `getInitialProps` belongs to `_document` (instead of `_app`),
// it's compatible with server-side generation (SSG).
MyDocument.getInitialProps = async (ctx) => {
  // Resolution order
  //
  // On the server:
  // 1. app.getInitialProps
  // 2. page.getInitialProps
  // 3. document.getInitialProps
  // 4. app.render
  // 5. page.render
  // 6. document.render
  //
  // On the server with error:
  // 1. document.getInitialProps
  // 2. app.render
  // 3. page.render
  // 4. document.render
  //
  // On the client
  // 1. app.getInitialProps
  // 2. page.getInitialProps
  // 3. app.render
  // 4. page.render

  // Render app and page and get the context of the page with collected side effects.
  const sheets = new ServerStyleSheets()
  const originalRenderPage = ctx.renderPage

  ctx.renderPage = () =>
    originalRenderPage({
      enhanceApp: (App) => (props) => sheets.collect(<App {...props} />),
    })

  const initialProps = await Document.getInitialProps(ctx)

  let css = sheets.toString()
  if (css && process.env.NODE_ENV === "production") {
    const min_css = minified_css_cache.get(css)
    if (min_css) {
      css = min_css
    } else {
      const old_css = css
      css = cleanCSS.minify(css).styles
      minified_css_cache.set(old_css, css)
    }
  }

  return {
    ...initialProps,
    // Styles fragment is rendered after the app and page rendering finish.
    styles: [...Children.toArray(initialProps.styles), <style id="jss-server-side" key="jss-server-side" dangerouslySetInnerHTML={{ __html: css }}></style>],
  }
}