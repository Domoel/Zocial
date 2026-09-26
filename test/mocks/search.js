export const calls = []
let mode = 'status'
export function setSearchMode (m) {
  mode = m
}
export async function search (instanceName, accessToken, url) {
  calls.push([instanceName, url])
  await new Promise(resolve => setTimeout(resolve, 5))
  if (mode === 'throw') throw new TypeError('Failed to fetch')
  if (mode === 'empty') return { statuses: [], accounts: [] }
  return { statuses: [{ id: instanceName + '-1', content: '<p>hi</p>', account: { display_name: 'X', avatar_static: 'a.png' }, media_attachments: [] }] }
}
