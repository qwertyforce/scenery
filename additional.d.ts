declare global {
    namespace NodeJS {
        interface ProcessEnv {
            api_domain: string,
            recaptcha_site_key: string,
            reverse_search_url: string,
            domain: string,
            ipns: string
        }
    }
}

declare module 'http' {
    interface IncomingMessage {
        session?: any
    }
}

export {}
