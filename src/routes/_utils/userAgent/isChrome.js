// @ts-check
import { thunk } from '../thunk.js'

export const isChrome = thunk(() => ZOCIAL_IS_BROWSER && /Chrome/.test(navigator.userAgent))
