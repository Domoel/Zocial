export function makeIcon ({ maskable, ios, fg = '#fff' }) {

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${maskable ? '0 0 100 100' : '6 6 88 88'}">
  <defs>
    <linearGradient id="zocialGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6633cc" />
      <stop offset="100%" stop-color="#3399ff" />
    </linearGradient>
  </defs>${
    maskable
      ? `<rect width="100" height="100" fill="url(#zocialGradient)"/>`
      : `<rect width="88" height="88" x="6" y="6" fill="url(#zocialGradient)"${
          ios ? '' : ' ry="22"'
        }/>`
  }<path fill="${fg}" d="M 20 20 H 80 V 35 L 40 70 H 80 V 85 H 20 V 70 L 60 35 H 20 V 20 Z"/></svg>`
}
