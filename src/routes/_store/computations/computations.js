import { instanceComputations } from './instanceComputations.js'
import { navComputations } from './navComputations.js'
import { i18nComputations } from './i18nComputations.js'

export function computations (store) {
  instanceComputations(store)
  // i18nComputations registers `messages`, which navComputations' navPages depends on — so it must
  // be set up first (computeds resolve their deps at registration time, incl. during SSR).
  i18nComputations(store)
  navComputations(store)
}
