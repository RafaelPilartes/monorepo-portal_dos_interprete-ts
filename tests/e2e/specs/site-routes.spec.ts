import { expect, test } from '@playwright/test'
import { type SmokeRoute, visitAndCapture } from './smoke'

const SITE = process.env.SITE_URL ?? 'http://localhost:5170'

// Site routes of docs/inventory/05-route-map.md §1 (step D1).
const routes: SmokeRoute[] = [
  { path: '/', name: 'home', expectText: 'Acesso Universal.' },
  { path: '/services', name: 'services', expectText: 'Serviços de Interpretação' },
  { path: '/how-it-works', name: 'how-it-works', expectText: 'Entenda o processo completo' },
  { path: '/impact', name: 'impact', expectText: 'Transformando Vidas' },
  { path: '/contact', name: 'contact', expectText: 'Entre em Contacto' },
  { path: '/for-requesters', name: 'for-requesters', expectText: 'Precisa de um' },
  { path: '/for-interpreters', name: 'for-interpreters', expectText: 'Rede de Intérpretes' },
  { path: '/interpreters', name: 'interpreters', expectText: 'Todos Intérpretes' },
  { path: '/tutorials', name: 'tutorials', expectText: 'Tutorias' },
]

for (const route of routes) {
  test(`site ${route.path} renders without errors`, async ({ page }) => {
    await visitAndCapture(page, SITE, 'D1', route)
  })
}

test('site /home redirects to /', async ({ page }) => {
  await page.goto(`${SITE}/home`)
  await expect(page).toHaveURL(`${SITE}/`)
})

test('site unknown path shows the Portuguese 404 without errors', async ({ page }) => {
  await visitAndCapture(page, SITE, 'D1', { path: '/does-not-exist', name: 'not-found', expectText: 'Página não encontrada' })
})

test('site interpreter card leads to the requester login with returnTo', async ({ page }) => {
  await page.goto(`${SITE}/interpreters`)
  const link = page.getByRole('link', { name: /Ver Perfil/ }).first()
  await expect(link).toHaveAttribute('href', /^http:\/\/localhost:5171\/login\?returnTo=%2Finterpreters%2F/)
})

test('site "Entrar" opens the requester login (D3 closes AD-013 for login and register)', async ({ page }) => {
  await page.goto(`${SITE}/`)
  await page.getByRole('link', { name: 'Entrar' }).first().click()
  await expect(page).toHaveURL(/^http:\/\/localhost:5171\/login$/)
  await expect(page.getByText('Bem-vindo de volta')).toBeVisible()
})

test('site "Ver Perfil" reaches the requester login with returnTo kept in the URL', async ({ page }) => {
  await page.goto(`${SITE}/interpreters`)
  await page.getByRole('link', { name: /Ver Perfil/ }).first().click()
  await expect(page).toHaveURL(/^http:\/\/localhost:5171\/login\?returnTo=%2Finterpreters%2F/)
  await expect(page.getByText('Bem-vindo de volta')).toBeVisible()
})
