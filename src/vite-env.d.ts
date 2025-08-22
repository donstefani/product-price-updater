/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SHOPIFY_API_KEY: string
  readonly VITE_SHOPIFY_API_SECRET: string
  readonly VITE_SHOPIFY_SCOPES: string
  readonly VITE_SHOPIFY_APP_URL: string
  readonly VITE_SHOPIFY_REDIRECT_URI: string
  readonly VITE_DEV_STORE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
