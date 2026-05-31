// @ts-check
import { thunk } from '../thunk.js'

export const isIOS = thunk(() => ZOCIAL_IS_BROWSER && /iP(?:hone|ad|od)/.test(navigator.userAgent))
