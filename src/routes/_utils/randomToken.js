// Random, unguessable hex token from the platform CSPRNG (16 bytes = 128 bits by default).
export function randomToken (byteLength = 16) {
  const bytes = new Uint8Array(byteLength)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
}
