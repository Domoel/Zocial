import { test } from 'node:test'
import assert from 'node:assert/strict'
import { notificationInfos, notMentions } from '../src/routes/_static/notifications.ts'
import { getTimeline } from '../src/routes/_api/timelines.js'

test('Mastodon 4.5+ notification types render natively', () => {
  for (const type of ['quote', 'quoted_update', 'severed_relationships', 'moderation_warning', 'annual_report']) {
    assert.ok(type in notificationInfos, type)
  }
  const severed = notificationInfos.severed_relationships({ notification: { event: { target_name: 'bad.example' } } })
  assert.equal(severed.selfEvent, true)
  assert.match(severed.actionText, /bad\.example/)
  assert.equal(notificationInfos.quote({ name: 'A' }).standalone, false)
  assert.ok(notMentions.includes('quote') && !notMentions.includes('mention'))
})

test('the Mentions tab asks for mentions only and filters what comes back', async () => {
  let requested
  globalThis.fetch = async url => {
    requested = url
    return {
      status: 200,
      headers: new Map(),
      json: async () => [{ id: '2', type: 'mention' }, { id: '1', type: 'severed_relationships' }]
    }
  }
  const { items } = await getTimeline('x.social', 't', 'notifications/mentions')
  assert.match(requested, /types%5B%5D=mention|types\[\]=mention/)
  assert.match(requested, /include_types(%5B%5D|\[\])=mention/)
  assert.deepEqual(items.map(n => n.id), ['2'])
})
