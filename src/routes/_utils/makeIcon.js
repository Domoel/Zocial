export function makeIcon ({ maskable, ios, fg = '#fff', bg = '#111111' }) {
  const viewBox = maskable ? '0 0 100 100' : '6 6 88 88'
  const background = maskable
    ? `<rect width="100" height="100" fill="${bg}"/>`
    : `<rect width="88" height="88" x="6" y="6" fill="${bg}"${ios ? '' : ' ry="22"'}/>`
  const mark = `<path fill="${fg}" d="M24 14h52a6 6 0 000 12h-4c-1.3 10-6.5 18-15 24 8.5 6 13.7 14 15 24h4a6 6 0 000 12H24a6 6 0 000-12h4c1.3-10 6.5-18 15-24-8.5-6-13.7-14-15-24h-4a6 6 0 000-12zm16 12c1.6 6.7 5.6 12.3 12 17 6.4-4.7 10.4-10.3 12-17H40zm0 48h24c-1.6-6.7-5.6-12.3-12-17-6.4 4.7-10.4 10.3-12 17z"/>`

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${background}${mark}</svg>`
}
