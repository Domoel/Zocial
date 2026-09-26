// Tell the service worker which account this window shows, so a push for another account isn't
// suppressed just because this window is visible (see pushIsInView in service-worker.js). Re-sent
// when the page becomes visible again or a new worker takes over, since the worker forgets it when
// the browser stops it.
export function serviceWorkerViewObservers (store) {
  if (!ZOCIAL_IS_BROWSER || !('serviceWorker' in navigator)) {
    return
  }
  const report = () => {
    const controller = navigator.serviceWorker.controller
    if (controller) {
      controller.postMessage({ type: 'zocial-view', instance: store.get().currentInstance || null })
    }
  }
  store.observe('currentInstance', report)
  navigator.serviceWorker.addEventListener('controllerchange', report)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      report()
    }
  })
}
