export function touchObservers (store) {
  if (!ZOCIAL_IS_BROWSER) {
    return
  }

  const onTouch = () => {
    store.set({ isUserTouching: true })
    window.removeEventListener('touchstart', onTouch)
  }

  window.addEventListener('touchstart', onTouch, { passive: true })
}
