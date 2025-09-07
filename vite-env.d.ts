/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENAI_URL: string
  readonly VITE_DOCS_URL: string
  // Wallets & integrations
  readonly VITE_PRIVY_APP_ID?: string
  readonly VITE_WALLETCONNECT_PROJECT_ID?: string
  readonly VITE_PARTICLE_PROJECT_ID?: string
  readonly VITE_PARTICLE_CLIENT_KEY?: string
  readonly VITE_PARTICLE_APP_ID?: string
  readonly VITE_MAGIC_API_KEY?: string
  readonly VITE_TREZOR_APP_URL?: string
  readonly VITE_TREZOR_EMAIL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
