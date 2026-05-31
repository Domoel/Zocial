// @ts-check
import { thunk } from '../thunk.js'

export const isWebKit = thunk(() => ZOCIAL_IS_BROWSER && 'webkitIndexedDB' in globalThis)
