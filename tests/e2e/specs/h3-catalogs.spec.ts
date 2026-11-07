import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { expect, test, type Page } from '@playwright/test'
import { ADMIN_URL, createConfirmedUser, repoRoot, SITE_URL, sqlLocal } from '../local'

// Step H3 in the browser (MASTER-PLAN H3: admin cria serviço → aparece em /services), plus the
// rules on screen: duplicate identifier, "Apagar" only for unused items, pricing mode locked once
// used (R-CAT-01, R-CAT-02). Signed in as the super_admin (admin.setup.ts).

test.describe.configure({ mode: 'serial' })

const evidence = path.join(repoRoot, 'docs/plan/evidence/H3')
mkdirSync(evidence, { recursive: true })
async function shot(page: Page, name: string): Promise<void> {
  await page.waitForTimeout(400)
  await page.screenshot({ path: path.join(evidence, `${name}.jpg`), type: 'jpeg', quality: 75 })
}

const stamp = Date.now().toString(36)
const slug = `interpretacao-${stamp}`
const title = `Interpretação ${stamp}`

test('the team creates a service in the side panel and it appears on /services (criterion 4)', async ({ page }) => {
  await page.goto(`${ADMIN_URL}/catalog/services`)
  await expect(page.getByRole('cell', { name: 'Saúde', exact: true })).toBeVisible()
  await shot(page, '01-services')
  await page.getByRole('button', { name: 'Novo' }).click()
  const panel = page.getByRole('dialog')
  await panel.getByLabel('Título').fill(title)
  await panel.getByLabel('Identificador').fill('saude')
  await panel.getByLabel('Descrição').fill('Serviço criado pelo teste do passo H3.')
  // An empty price is not saved as 0 Kz (review of H3, AD-032).
  await panel.getByRole('button', { name: 'Guardar' }).click()
  await expect(panel.getByText('Indica o preço de tabela.')).toBeVisible()
  await panel.getByLabel(/Preço de tabela/).fill('17500')
  await panel.getByRole('button', { name: 'Guardar' }).click()
  await expect(panel.getByText('Já existe um serviço com este identificador.')).toBeVisible()
  await shot(page, '02-duplicate-identifier')
  await panel.getByLabel('Identificador').fill(slug)
  await panel.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.getByRole('cell', { name: title })).toBeVisible()
  await shot(page, '03-service-created')

  await page.goto(`${SITE_URL}/services`)
  await expect(page.getByRole('heading', { name: title })).toBeVisible()
  await expect(page.getByText('a partir de 17 500 Kz por hora')).toBeVisible()
  // The cards fade in as they enter the screen: scroll, then let the animation finish.
  await page.getByRole('heading', { name: 'Saúde' }).scrollIntoViewIfNeeded()
  await page.waitForTimeout(1500)
  await shot(page, '04-site-services')
})

test('an item in use: no "Apagar", the pricing mode is locked, and deactivating hides it from /services (R-CAT-01, R-CAT-02, criterion 3)', async ({ page }) => {
  // Test setup: an interpreter offers the service (the interpreter's screen for this is H4).
  const interpreter = await createConfirmedUser('Inês Catálogo')
  sqlLocal(`SELECT identity.become_interpreter('${interpreter.id}', NULL, NULL)`)
  sqlLocal(`INSERT INTO directory.interpreter_services (interpreter_id, service_id, price_aoa)
            SELECT '${interpreter.id}', id, 9000 FROM catalog.services WHERE slug = '${slug}'`)

  await page.goto(`${ADMIN_URL}/catalog/services`)
  const row = page.getByRole('row').filter({ hasText: title })
  await expect(row.getByText('1 sítio')).toBeVisible()
  await expect(row.getByRole('button', { name: 'Apagar' })).toHaveCount(0)
  await row.getByRole('button', { name: 'Editar' }).click()
  const panel = page.getByRole('dialog')
  await expect(panel.getByRole('combobox')).toBeDisabled()
  await expect(panel.getByText(/o modo de preço não muda/)).toBeVisible()
  await expect(panel.getByLabel('Identificador')).toBeDisabled()
  await shot(page, '05-pricing-mode-locked')
  await page.keyboard.press('Escape')

  await row.getByRole('button', { name: 'Desactivar' }).click()
  await expect(row.getByText('Inactivo')).toBeVisible()
  // "Desactivar" sends only the state: the price stays as it was.
  await expect(row.getByText('17 500 Kz por hora')).toBeVisible()
  await shot(page, '06-deactivated')
  await page.goto(`${SITE_URL}/services`)
  await expect(page.getByRole('heading', { name: 'Saúde' })).toBeVisible()
  await expect(page.getByRole('heading', { name: title })).toHaveCount(0)
})

test('an unused language is deleted; the empty and loading states of the lists', async ({ page }) => {
  await page.goto(`${ADMIN_URL}/catalog/languages`)
  await page.getByRole('button', { name: 'Novo' }).click()
  const panel = page.getByRole('dialog')
  const code = `t${stamp.replace(/[^a-z]/g, '').slice(0, 6) || 'x'}`
  await panel.getByLabel('Código').fill(code)
  await panel.getByLabel('Nome').fill(`Língua ${stamp}`)
  await panel.getByRole('button', { name: 'Guardar' }).click()
  const row = page.getByRole('row').filter({ hasText: `Língua ${stamp}` })
  await expect(row.getByText('Nunca usado')).toBeVisible()
  await shot(page, '07-languages')
  await row.getByRole('button', { name: 'Apagar' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Apagar' }).click()
  await expect(page.getByRole('row').filter({ hasText: `Língua ${stamp}` })).toHaveCount(0)

  // Loading, then an empty list (the request answers no rows).
  let release: () => void = () => undefined
  const held = new Promise<void>((resolve) => { release = resolve })
  await page.route('**/rest/v1/specialty_admin*', async (route) => {
    await held
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]', headers: { 'content-range': '*/0' } })
  })
  await page.goto(`${ADMIN_URL}/catalog/specialties`)
  await expect(page.getByRole('status', { name: 'A carregar…' })).toBeVisible()
  await shot(page, '08-loading')
  release()
  await expect(page.getByText('Ainda não há especialidades.')).toBeVisible()
  await shot(page, '09-empty')
})
