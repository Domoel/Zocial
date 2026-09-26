import { safeLocalStorage as LS } from '../_utils/safeLocalStorage.js'
import { lifecycle } from '../_utils/lifecycle.ts'
import { safeParse } from '../_utils/safeParse.js'
import * as storePackage from 'svelte/store.umd.js'

const { Store } = /** @type {import('svelte/store.d.ts')} */(storePackage)

// Each tab/window keeps its own current account; every other persisted key is shared.
const PER_TAB_KEYS = new Set(['currentInstance'])

export class LocalStorageStore extends Store {
  constructor (state, keysToWatch) {
    super(state)
    if (!ZOCIAL_IS_BROWSER) {
      return
    }
    this._keysToWatch = keysToWatch
    this._keysToSave = {}
    this._syncedAt = {} // key -> when this tab last wrote or took over that key
    const newState = {}
    for (let i = 0, len = LS.length; i < len; i++) {
      const key = LS.key(i)
      if (key.startsWith('store_')) {
        const item = LS.getItem(key)
        newState[key.substring(6)] = safeParse(item)
        this._syncedAt[key.substring(6)] = Date.now() // what we just read counts as in sync
      }
    }
    this.set(newState)
    this.on('state', ({ changed }) => {
      if (this._applyingExternalChange) {
        return // came from another tab and is already in localStorage
      }
      Object.keys(changed).forEach(change => {
        if (this._keysToWatch.has(change)) {
          this._keysToSave[change] = true
        }
      })
    })
    if (ZOCIAL_IS_BROWSER) {
      lifecycle.addEventListener('statechange', e => {
        if (e.newState === 'passive') {
          this.save()
        }
      })
      // Other tabs/windows of the app write the same keys, and save() writes this tab's *whole* value
      // of every key it changed. Without taking their writes over, a tab loaded earlier would revert
      // them: resurrect an account logged out elsewhere, drop one added elsewhere, bring back a posted
      // draft, undo a push change. A page restored from the back/forward cache missed those events.
      window.addEventListener('storage', e => {
        if (e.key && e.key.startsWith('store_') && e.newValue !== null) {
          this._applyExternalChange(e.key.substring(6), e.newValue)
        }
      })
      window.addEventListener('pageshow', e => {
        if (e.persisted) {
          this._reloadFromStorage()
        }
      })
    }
  }

  _applyExternalChange (key, rawValue) {
    if (!this._keysToWatch.has(key) || PER_TAB_KEYS.has(key)) {
      return
    }
    let value
    try {
      value = safeParse(rawValue)
    } catch (e) {
      return
    }
    const previous = this.get()[key]
    // A key can bring a merge rule (e.g. composeData keeps this tab's unsaved drafts); otherwise the
    // other tab's value simply wins.
    const merge = this['mergeExternal_' + key]
    const merged = merge ? merge.call(this, previous, value, this._syncedAt[key] || 0) : value
    this._applyingExternalChange = true
    try {
      this.set({ [key]: merged })
    } finally {
      this._applyingExternalChange = false
    }
    if (merged === value) {
      delete this._keysToSave[key]
    } else {
      this._keysToSave[key] = true // our additions still have to be written
    }
    this._syncedAt[key] = Date.now()
    this.fire('externalChange', { key, previous })
  }

  // Take over the current localStorage value of these keys right now — before an operation another
  // tab may just have changed them for (its `storage` event can still be queued). Keys with unsaved
  // changes in this tab are left alone.
  reloadKeys (keys) {
    if (!ZOCIAL_IS_BROWSER) {
      return
    }
    for (const key of keys) {
      if (this._keysToSave[key]) {
        continue
      }
      const rawValue = LS.getItem(`store_${key}`)
      if (rawValue !== null && rawValue !== JSON.stringify(this.get()[key])) {
        this._applyExternalChange(key, rawValue)
      }
    }
  }

  _reloadFromStorage () {
    for (let i = 0, len = LS.length; i < len; i++) {
      const key = LS.key(i)
      if (key && key.startsWith('store_')) {
        const rawValue = LS.getItem(key)
        if (rawValue !== null && rawValue !== JSON.stringify(this.get()[key.substring(6)])) {
          this._applyExternalChange(key.substring(6), rawValue)
        }
      }
    }
  }

  save () {
    if (!ZOCIAL_IS_BROWSER) {
      return
    }
    // Per key and never throwing: save() runs in the middle of logout, posting and uploads, and a full
    // localStorage (QuotaExceededError) must not abort those. A key that failed stays queued.
    const failedKeys = {}
    Object.keys(this._keysToSave).forEach(key => {
      try {
        LS.setItem(`store_${key}`, JSON.stringify(this.get()[key]))
        this._syncedAt[key] = Date.now()
      } catch (e) {
        failedKeys[key] = true
        console.warn('failed to persist', key, (e && e.message) || e)
      }
    })
    this._keysToSave = failedKeys
  }
}
