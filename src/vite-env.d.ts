/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ADSBDB_BASE_URL: string
  readonly VITE_OPENSKY_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
