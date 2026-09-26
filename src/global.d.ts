declare const ZOCIAL_IS_SERVICE_WORKER: boolean
declare const ZOCIAL_IS_BROWSER: boolean
declare const ZOCIAL_VERSION: string
declare const ZOCIAL_CHANNEL: string

interface Window {
  __ZOCIAL_SINGLE_INSTANCE__?: string
}

// escape-html ships no type declarations
declare module 'escape-html' {
  export default function escapeHtml(html: string): string
}
