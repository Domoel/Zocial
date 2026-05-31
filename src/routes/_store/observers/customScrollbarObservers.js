import { store } from '../store.js'

const theScrollbarStyle = ZOCIAL_IS_BROWSER && document.getElementById('theScrollbarStyle')

export function customScrollbarObservers () {
  store.observe('disableCustomScrollbars', disableCustomScrollbars => {
    if (!ZOCIAL_IS_BROWSER) {
      return
    }

    // disables or enables the style
    theScrollbarStyle.setAttribute('media', disableCustomScrollbars ? 'only x' : 'all')
  }, { init: false }) // init:false because the inline script takes care of it
}
