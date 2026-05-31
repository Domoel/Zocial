// @ts-check
import { thunk } from '../thunk.js'

export const isMobile = thunk(() => ZOCIAL_IS_BROWSER && /(?:iPhone|iPod|iPad|Android|KAIOS)/.test(navigator.userAgent))
