declare const ZOCIAL_IS_SERVICE_WORKER: boolean
declare const ZOCIAL_IS_BROWSER: boolean
declare const ZOCIAL_VERSION: string
declare const ZOCIAL_ENV: string

interface Window {
  __ZOCIAL_SINGLE_INSTANCE__?: string
}
