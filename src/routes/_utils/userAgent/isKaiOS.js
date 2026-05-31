// @ts-check
import { thunk } from '../thunk.js'

export const isKaiOS = thunk(() => ZOCIAL_IS_BROWSER && /KAIOS/.test(navigator.userAgent))
