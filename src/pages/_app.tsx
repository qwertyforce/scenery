import { EmotionCache } from "@emotion/react";
import { CacheProvider } from '@emotion/react';
import createCache from "@emotion/cache"
import { ThemeProvider } from "@mui/material/styles"
import CssBaseline from "@mui/material/CssBaseline"
import theme from '../components/theme'
import { useEffect } from "react";
import { DataContextProvider } from "../components/DataContext"
import { AppProps } from 'next/app'
import "../components/styles.css"

let muiCache: EmotionCache | undefined = undefined;

export const createMuiCache = () => muiCache = createCache({ "key": "mui", "prepend": true })

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("useIPFS") === null) {
      localStorage.setItem('useIPFS', 'false')
    }
  }, [])
  return (
    <CacheProvider value={muiCache ?? createMuiCache()}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <DataContextProvider>
          <Component {...pageProps} />
        </DataContextProvider>
      </ThemeProvider>
    </CacheProvider>
  )
}