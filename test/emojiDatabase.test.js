// @mock emoji-picker-element/database.js -> ./mocks/emojiPickerDatabase.js
// @mock lifecycle.ts -> ./mocks/lifecycle.js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { guardPickerDatabase } from '../src/routes/_utils/emojiDatabase.js'

test("the emoji picker's own update check is guarded (v1.12.2)", async () => {
  const unhandled = []
  const onUnhandled = e => unhandled.push(e)
  process.on('unhandledRejection', onUnhandled)
  const warn = console.warn
  const warnings = []
  console.warn = (...args) => warnings.push(args.join(' '))
  try {
    const db = { ready: () => Promise.resolve() }
    db._lazyUpdate = new Promise((resolve, reject) => setTimeout(() => reject(new Error('Failed to fetch: /emoji-en-US.json:  502')), 10))
    guardPickerDatabase(db)
    guardPickerDatabase({ ready: () => Promise.reject(new Error('first visit failed')) }) // the picker shows that itself
    await new Promise(resolve => setTimeout(resolve, 40))
  } finally {
    process.off('unhandledRejection', onUnhandled)
    console.warn = warn
  }
  assert.equal(unhandled.length, 0)
  assert.equal(warnings.length, 1)
})
