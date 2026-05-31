export function reduceMotionObservers (store) {
  if (!ZOCIAL_IS_BROWSER) {
    return
  }

  store.observe('reduceMotion', reduceMotion => {
    document.body.classList.toggle('reduce-motion', reduceMotion)
  })
}
