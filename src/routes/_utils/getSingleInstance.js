// Read SINGLE_INSTANCE at runtime from window config.
// Using a window global prevents webpack/terser from dead-code-eliminating
// conditional code paths at build time when using a truthy build placeholder.
export function getSingleInstance () {
  return ZOCIAL_IS_BROWSER ? (window.__ZOCIAL_SINGLE_INSTANCE__ || '') : ''
}
