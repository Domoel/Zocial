import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sockets } from './mocks/browserGlobals.js'
import { WebSocketClient } from '../src/routes/_thirdparty/websocket/websocket.js'

const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
const live = () => sockets.filter(s => !s.closed && s.readyState !== 3)

test('a reconnect during a pending backoff leaves exactly one live socket', async () => {
  sockets.length = 0
  const client = new WebSocketClient('wss://a')
  sockets[0].readyState = 3
  sockets[0].onclose({ code: 1006 }) // dropped by the server: backoff pending
  client.reset()
  client.reconnect() // the app comes back to the foreground
  await wait(300) // the pending backoff would fire here
  assert.equal(sockets.length, 2)
  assert.equal(live().length, 1)
  client.close()
})

test('a reconnect closes the previous socket and detaches its handlers', () => {
  sockets.length = 0
  const client = new WebSocketClient('wss://b')
  client.reconnect()
  assert.equal(sockets[0].closed, true)
  assert.equal(sockets[0].onmessage, null)
  client.close()
})

test('close() cancels a pending reconnect', async () => {
  sockets.length = 0
  const client = new WebSocketClient('wss://c')
  sockets[0].readyState = 3
  sockets[0].onclose({ code: 1006 })
  client.close()
  await wait(300)
  assert.equal(sockets.length, 1)
})
