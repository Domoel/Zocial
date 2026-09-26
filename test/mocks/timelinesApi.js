let pages = []
export function setPages (p) {
  pages = p
}
export async function getTimeline () {
  return { items: pages.shift() || [] }
}
