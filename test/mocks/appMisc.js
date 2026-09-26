// No-op stand-ins for UI and browser-only modules the actions import.
export const toast = { say () {} }
export const database = {
  insertStatus: async () => {},
  deleteCachedMediaFile () {},
  clearDatabaseForInstance: async () => {}
}
export function goto () {}
export async function importVirtualListStore () {
  return { virtualListStore: { clearRealmByPrefix () {} } }
}
export function switchToTheme () {}
export function clearLogs () {}
export function addStatusOrNotification () {}
export async function rehydrateStatusOrNotification () {}
export function formatIntl (key, values) {
  return key + ' ' + JSON.stringify(values)
}
export function getSingleInstance () {
  return ''
}
export async function unsubscribeBrowserPush () {}
