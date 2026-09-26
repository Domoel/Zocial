export const written = {}
let full = true
export function setStorageFull (value) {
  full = value
}
export const safeLocalStorage = {
  setItem (key, value) {
    if (full && key === 'store_big') {
      const e = new Error('quota')
      e.name = 'QuotaExceededError'
      throw e
    }
    written[key] = value
  },
  getItem () {
    return null
  }
}
