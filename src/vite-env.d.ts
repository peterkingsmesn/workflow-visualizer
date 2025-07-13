/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_WEBSOCKET_URL: string
  readonly VITE_APP_TITLE: string
  readonly VITE_MAX_FILE_SIZE: number
  readonly VITE_ENABLE_COLLABORATION: boolean
  readonly VITE_AUTO_SAVE_INTERVAL: number
  readonly VITE_ANALYSIS_TIMEOUT: number
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}