import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { createViteConfig, readRootVersion } from '../vite.js'

test('readRootVersion returns the root package.json version', () => {
  const root = JSON.parse(readFileSync(new URL('../../../package.json', import.meta.url), 'utf8'))
  assert.equal(readRootVersion(), root.version)
})

test('createViteConfig pins the port and injects version and commit', () => {
  const config = createViteConfig({ port: 5170, root: '/tmp/app' })
  assert.equal(config.server.port, 5170)
  assert.equal(config.server.strictPort, true)
  assert.equal(config.server.host, undefined)
  assert.equal(config.define.__APP_VERSION__, JSON.stringify(readRootVersion()))
  assert.match(JSON.parse(config.define.__APP_COMMIT__), /^([0-9a-f]{7,}|unknown)$/)
})
