import { importSnackbar } from '../../_utils/asyncModules/importSnackbar.js'
import { store } from '../../_store/store.js'

let snackbar

const lazySnackbar = {
  async announce (text, buttonText, buttonAction) {
    if (!snackbar) {
      const Snackbar = await importSnackbar()
      if (!snackbar) {
        snackbar = new Snackbar({
          target: document.querySelector('#theSnackbar'),
          store
        })
        if (process.env.NODE_ENV !== 'production') {
          window.snackbar = snackbar // for debugging
        }
      }
    }
    snackbar.announce(text, buttonText, buttonAction)
  }
}

export { lazySnackbar as snackbar }
