export const tokens = { 'tok-a': 'a.social' }
export async function getInstanceForPushToken (token) {
  return tokens[token]
}
export async function setWebShareData () {}
export function closeKeyValIDBConnection () {}
export async function getLastTheme () {}
