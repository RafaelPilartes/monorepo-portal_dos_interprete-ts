import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, type Page } from '@playwright/test'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')

export interface SmokeRoute {
  /** Path inside the app, e.g. "/services". */
  path: string
  /** File name of the screenshot (without extension). */
  name: string
  /** Text that must be visible once the screen rendered. */
  expectText: string
}

/** Errors that are the VM's blocked network, not the app: fonts, images and videos from other hosts. */
function isBlockedResource(text: string): boolean {
  return /Failed to load resource|net::ERR_/.test(text)
}

/**
 * Opens a route and fails on a blank screen, a page error or a console error
 * (foundation.md §D: "falha se alguma der erro ou ecrã em branco").
 */
export async function visitAndCapture(page: Page, baseUrl: string, step: string, route: SmokeRoute): Promise<void> {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
  page.on('console', (message) => {
    if (message.type() === 'error' && !isBlockedResource(message.text())) {
      errors.push(`console.error: ${message.text()}`)
    }
  })

  const response = await page.goto(`${baseUrl}${route.path}`, { waitUntil: 'domcontentloaded' })
  expect(response?.status(), `HTTP status of ${route.path}`).toBe(200)
  await expect.poll(async () => (await page.locator('#root').innerText()).trim().length, { message: `blank screen at ${route.path}` }).toBeGreaterThan(0)
  await expect(page.getByText(route.expectText, { exact: false }).first()).toBeVisible()
  await page.waitForTimeout(500)

  const dir = path.join(repoRoot, 'docs/plan/evidence', step)
  mkdirSync(dir, { recursive: true })
  await page.screenshot({ path: path.join(dir, `${route.name}.jpg`), type: 'jpeg', quality: 75 })
  expect(errors, `errors on ${route.path}`).toEqual([])
}
