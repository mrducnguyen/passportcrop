/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FACE_DETECTION: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

/** Injected by Vite define — true when VITE_FACE_DETECTION=true */
declare const __FACE_DETECTION__: boolean

/** Injected by Vite define — true when VITE_BG_REMOVAL=true */
declare const __BG_REMOVAL__: boolean
