import { get, set, del } from '../_thirdparty/idb-keyval/idb-keyval.js'

del('theme-color')

export function setLastTheme (data) {
  return set('theme', data)
}

export function getLastTheme () {
  return get('theme')
}

export function setIconColors (data) {
  return set('iconColors', data)
}

export function getIconColors () {
  return get('iconColors')
}
