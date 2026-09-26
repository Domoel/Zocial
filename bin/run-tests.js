// Unit tests for the parts that broke before (caches, streaming, rendering, compose, logout, …).
// The app code is written for the browser and the webpack build, so each test file is bundled with
// esbuild first; modules that need a browser, IndexedDB or the store are swapped for mocks, declared
// at the top of the test file:
//
//   // @mock _store/store.js -> ./mocks/store.js     (import specifier suffix -> file under test/)
//   // @define ZOCIAL_IS_BROWSER=true
//
// The bundles are then run with Node's built-in test runner (node:test).
import { build } from 'esbuild'
import { spawnSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const testDir = path.join(root, 'test')
const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zocial-tests-'))

const escapeRegExp = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function readDirectives (source) {
  const mocks = []
  const define = {
    ZOCIAL_IS_BROWSER: 'false',
    ZOCIAL_IS_SERVICE_WORKER: 'false',
    ZOCIAL_VERSION: '"test"',
    ZOCIAL_CHANNEL: '"dev"',
    'process.env.NODE_ENV': '"test"'
  }
  for (const [, from, to] of source.matchAll(/^\/\/ @mock (\S+) -> (\S+)$/gm)) {
    mocks.push({ filter: new RegExp('(^|/)' + escapeRegExp(from) + '$'), file: path.join(testDir, to) })
  }
  for (const [, key, value] of source.matchAll(/^\/\/ @define (\S+)=(\S+)$/gm)) {
    define[key] = value
  }
  return { mocks, define }
}

const files = process.argv.slice(2).length
  ? process.argv.slice(2).map(f => path.resolve(f))
  : fs.readdirSync(testDir).filter(f => f.endsWith('.test.js')).sort().map(f => path.join(testDir, f))

const bundles = []
for (const file of files) {
  const { mocks, define } = readDirectives(fs.readFileSync(file, 'utf8'))
  const outfile = path.join(outDir, path.basename(file).replace(/\.js$/, '.mjs'))
  await build({
    entryPoints: [file],
    outfile,
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'node20',
    logLevel: 'error',
    define,
    plugins: [{
      name: 'test-mocks',
      setup (b) {
        for (const { filter, file: mock } of mocks) {
          b.onResolve({ filter }, () => ({ path: mock }))
        }
      }
    }]
  })
  bundles.push(outfile)
}

const result = spawnSync(process.execPath, ['--test', ...bundles], { stdio: 'inherit' })
fs.rmSync(outDir, { recursive: true, force: true })
process.exit(result.status === null ? 1 : result.status)
