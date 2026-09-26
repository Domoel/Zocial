import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'
import path from 'path'
import parse from 'format-message-parse'
import { LOCALE_TABLES, DEFAULT_LOCALE } from '../src/routes/_intl/locales.js'

const english = LOCALE_TABLES[DEFAULT_LOCALE]
const translations = Object.entries(LOCALE_TABLES).filter(([locale]) => locale !== DEFAULT_LOCALE)

// the arguments used in a parsed message ({error}, {count, plural, …}, nested) -> their type
function argumentTypes (ast, types = {}) {
  for (const element of ast) {
    if (Array.isArray(element)) {
      types[element[0]] = element[1] || 'argument'
      for (const part of element.slice(2)) {
        if (part && typeof part === 'object') {
          for (const sub of Object.values(part)) {
            if (Array.isArray(sub)) argumentTypes(sub, types)
          }
        }
      }
    }
  }
  return types
}

// A variant switch without a value falls back to its `other` branch; a plain {placeholder} the code
// doesn't pass would be shown literally.
const VARIANT_TYPES = new Set(['select', 'plural', 'selectordinal'])

test('every locale has exactly the English keys', () => {
  const englishKeys = Object.keys(english).sort()
  for (const [locale, table] of translations) {
    const keys = new Set(Object.keys(table))
    assert.deepEqual(englishKeys.filter(key => !keys.has(key)), [], `${locale} is missing keys`)
    assert.deepEqual([...keys].filter(key => !(key in english)), [], `${locale} has keys English doesn't`)
  }
})

test('every message parses (a broken one would fall back to English or the raw key)', () => {
  for (const [locale, table] of Object.entries(LOCALE_TABLES)) {
    for (const [key, message] of Object.entries(table)) {
      assert.equal(typeof message, 'string', `${locale}.${key} is not a string`)
      assert.doesNotThrow(() => parse(message), `${locale}.${key} does not parse`)
    }
  }
})

test('translations keep every English placeholder and add only variant switches', () => {
  const problems = []
  for (const [locale, table] of translations) {
    for (const [key, message] of Object.entries(table)) {
      if (!(key in english)) continue
      const expected = argumentTypes(parse(english[key]))
      const actual = argumentTypes(parse(message))
      for (const name of Object.keys(expected)) {
        if (!(name in actual)) problems.push(`${locale}.${key} lost the placeholder {${name}}`)
      }
      for (const [name, type] of Object.entries(actual)) {
        if (!(name in expected) && !VARIANT_TYPES.has(type)) problems.push(`${locale}.${key} adds the plain placeholder {${name}}`)
      }
    }
  }
  assert.deepEqual(problems, [])
})

test("every 'intl.x' key used in the code exists in English", () => {
  const used = new Set()
  const walk = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(file)
      } else if (/\.(js|ts|html)$/.test(entry.name)) {
        for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
          if (/^\s*(\/\/|\*|\/\*)/.test(line)) continue // comments explain the 'intl.x' pattern
          for (const [, key] of line.matchAll(/['"`]intl\.([A-Za-z0-9_]+)['"`]/g)) {
            used.add(key)
          }
        }
      }
    }
  }
  walk(path.resolve('src'))
  const missing = [...used].filter(key => !(key in english)).sort()
  assert.deepEqual(missing, [], 'keys used in the code but missing in en-US')
})
