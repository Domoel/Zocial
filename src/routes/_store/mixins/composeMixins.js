import { get } from '../../_utils/lodash-lite.js'

export function composeMixins (Store) {
  Store.prototype.setComposeData = function (realm, obj) {
    const { composeData, currentInstance } = this.get()
    const instanceNameData = composeData[currentInstance] = composeData[currentInstance] || {}
    instanceNameData[realm] = Object.assign(
      instanceNameData[realm] || {},
      { ts: Date.now() },
      obj
    )
    this.set({ composeData })
  }

  Store.prototype.getComposeData = function (realm, key) {
    const { composeData, currentInstance } = this.get()
    return get(composeData, [currentInstance, realm, key])
  }

  Store.prototype.clearComposeData = function (realm) {
    const { composeData, currentInstance } = this.get()
    if (composeData && composeData[currentInstance]) {
      delete composeData[currentInstance][realm]
    }
    this.set({ composeData })
  }

  // Another tab wrote composeData (see LocalStorageStore). Its value wins — including a draft it
  // posted and removed — except for drafts this tab changed after it last synced composeData: those
  // are unsaved typing here and must not be overwritten. Drafts carry `ts` (setComposeData).
  Store.prototype.mergeExternal_composeData = function (local, external, syncedAt) {
    const merged = Object.assign({}, external)
    let keptLocal = false
    for (const instanceName of Object.keys(local || {})) {
      for (const realm of Object.keys(local[instanceName] || {})) {
        const draft = local[instanceName][realm]
        const theirs = external && external[instanceName] && external[instanceName][realm]
        if (draft && draft.ts > syncedAt && (!theirs || !(theirs.ts >= draft.ts))) {
          merged[instanceName] = Object.assign({}, merged[instanceName], { [realm]: draft })
          keptLocal = true
        }
      }
    }
    return keptLocal ? merged : external
  }
}
