import { instanceComputations } from './instanceComputations.js'
import { navComputations } from './navComputations.js'
import { i18nComputations } from './i18nComputations.js'

export function computations (store) {
  instanceComputations(store)
  navComputations(store)
  i18nComputations(store)
}
