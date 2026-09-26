// Store surface for compose and logout: compose data per instance/realm plus the persisted maps.
const state = { online: true, currentInstance: 'a.social', accessToken: 'tok-a', composeData: {}, saves: 0 }
export const store = {
  get: () => state,
  set (obj) {
    Object.assign(state, obj)
  },
  save () {
    state.saves++
  },
  getComposeData: (realm, key) => ((state.composeData[state.currentInstance] || {})[realm] || {})[key],
  setComposeData (realm, obj) {
    const instanceData = (state.composeData[state.currentInstance] = state.composeData[state.currentInstance] || {})
    instanceData[realm] = Object.assign(instanceData[realm] || {}, obj)
  },
  clearComposeData (realm) {
    delete (state.composeData[state.currentInstance] || {})[realm]
  },
  clearTimelineDataForInstance () {},
  clearAutosuggestDataForInstance () {},
  runIfLoggedIn () {}
}
