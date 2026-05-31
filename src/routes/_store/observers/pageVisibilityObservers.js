export function pageVisibilityObservers (store) {
  if (!ZOCIAL_IS_BROWSER) {
    return
  }

  document.addEventListener('visibilitychange', () => {
    store.set({ pageVisibilityHidden: document.hidden })
  })
}
