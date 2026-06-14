import LoadingMask from '../_components/LoadingMask.html'
import { store } from '../_store/store.js'

let loadingMask

if (ZOCIAL_IS_BROWSER) {
  loadingMask = new LoadingMask({
    target: document.querySelector('#loading-mask'),
    store
  })
  if (process.env.NODE_ENV !== 'production') {
    window.loadingMask = loadingMask // for debugging
  }
} else {
  loadingMask = {
  }
}

export { loadingMask }
