import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { expect, test, type Page } from '@playwright/test'
import { ADMIN_URL, repoRoot, requireLocalSupabase } from '../local'

// Step H1 in the browser against the local database (MASTER-PLAN, H1: "o admin entra e publica uma
// versão no ecrã"; staff-and-config.md screens). Signed in as the super_admin (admin.setup.ts),
// except where a test signs in itself.

const evidence = path.join(repoRoot, 'docs/plan/evidence/H1')
mkdirSync(evidence, { recursive: true })
// A short wait lets dialogs finish their opening animation before the picture.
async function shot(page: Page, name: string): Promise<void> {
  await page.waitForTimeout(400)
  await page.screenshot({ path: path.join(evidence, `${name}.jpg`), type: 'jpeg', quality: 75 })
}

test.describe('signing in', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('wrong password: the screen says it, without saying which field', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/login`)
    await page.getByLabel('Email', { exact: true }).fill('admin@portal.local')
    await page.getByLabel('Palavra-passe', { exact: true }).fill('not-the-password-1')
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page.getByRole('alert')).toHaveText('Email ou palavra-passe errados.')
    await shot(page, '01-login-wrong-password')
  })

  test('an account outside the team is told the area is only for the team', async ({ page }) => {
    const local = requireLocalSupabase()
    const email = `e2e-${randomUUID()}@example.ao`
    const password = `Senha-${randomUUID()}`
    const created = await fetch(`${local.API_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: { authorization: `Bearer ${local.SERVICE_ROLE_KEY}`, apikey: local.SERVICE_ROLE_KEY, 'content-type': 'application/json' },
      body: JSON.stringify({ email, password, email_confirm: true }),
    })
    expect(created.ok).toBe(true)
    await page.goto(`${ADMIN_URL}/login?returnTo=/team`)
    await page.getByLabel('Email', { exact: true }).fill(email)
    await page.getByLabel('Palavra-passe', { exact: true }).fill(password)
    await page.getByRole('button', { name: 'Entrar' }).click()
    // From H2 a new account accepts the legal documents in force first (R-PRIV-02).
    await page.getByLabel('Li e aceito estas versões.').check()
    await page.getByRole('button', { name: 'Aceitar e continuar' }).click()
    await expect(page.getByText('Esta área é só para a equipa do Portal')).toBeVisible()
    await expect(page).toHaveURL(`${ADMIN_URL}/team`)
    await shot(page, '02-not-staff')
  })

  test('a visitor without a session is sent to the login, and returnTo cannot leave the app', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/audit`)
    await expect(page).toHaveURL(`${ADMIN_URL}/login?returnTo=%2Faudit`)
    await shot(page, '03-login')
  })
})

test('the team list (loading, then the data)', async ({ page }) => {
  let release: () => void = () => undefined
  const held = new Promise<void>((resolve) => { release = resolve })
  await page.route('**/rest/v1/staff_directory*', async (route) => { await held; await route.continue() })
  await page.goto(`${ADMIN_URL}/team`)
  await expect(page.getByRole('status', { name: 'A carregar…' })).toBeVisible()
  await shot(page, '04-team-loading')
  release()
  await expect(page.getByRole('cell', { name: 'admin@portal.local' })).toBeVisible()
  await shot(page, '05-team')
})

test('a read that fails shows the catalog message and "Tentar outra vez"', async ({ page }) => {
  await page.route('**/rest/v1/staff_directory*', (route) =>
    route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ code: 'XX000', message: 'database unavailable' }) }),
  )
  await page.goto(`${ADMIN_URL}/team`)
  // supabase-js repeats a 503 three times before the screen shows the error.
  await expect(page.getByRole('button', { name: 'Tentar outra vez' })).toBeVisible({ timeout: 15_000 })
  await expect(page.getByRole('alert')).toContainText('Algo correu mal do nosso lado')
  await shot(page, '06-team-error')
})

test('the super_admin publishes a configuration version and sees it in the audit', async ({ page }) => {
  await page.goto(`${ADMIN_URL}/settings/config`)
  await expect(page.getByText(/Versão em vigor: \d+/)).toBeVisible()
  await shot(page, '07-config-in-force')

  await page.getByRole('button', { name: 'Criar rascunho' }).click()
  await expect(page.getByText(/Rascunho — versão \d+/)).toBeVisible()
  const field = page.getByLabel('Validade de um convite a intérprete (horas)')
  // Always a different value from the one in force, so there is exactly this difference to show.
  const next = (await field.inputValue()) === '47' ? '49' : '47'
  await field.fill('-3')
  await page.getByRole('button', { name: 'Guardar rascunho' }).click()
  await expect(page.getByText('Indica um número inteiro, zero ou maior.')).toBeVisible()
  await shot(page, '08-config-draft-invalid')
  await field.fill(next)
  await page.getByRole('button', { name: 'Publicar…' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('cell', { name: 'Validade de um convite a intérprete' })).toBeVisible()
  await expect(dialog.getByRole('cell', { name: `${next} horas` })).toBeVisible()
  await shot(page, '09-config-publish-differences')
  await dialog.getByRole('button', { name: 'Publicar' }).click()
  await expect(page.getByText(/Versão \d+ publicada\./)).toBeVisible()
  await expect(page.getByText(`${next} horas`).first()).toBeVisible()
  await shot(page, '10-config-published')

  await page.goto(`${ADMIN_URL}/audit`)
  const row = page.getByRole('row').filter({ hasText: 'config.published' }).first()
  await expect(row).toBeVisible()
  await shot(page, '11-audit')
  await row.getByRole('button', { name: 'Ver' }).click()
  await expect(page.getByRole('dialog').getByText(`"invite_expiry_hours": ${next}`)).toBeVisible()
  await shot(page, '12-audit-detail')
})

test('the audit says when a period has no entries', async ({ page }) => {
  await page.goto(`${ADMIN_URL}/audit`)
  await page.getByLabel('De', { exact: true }).fill('2099-01-01')
  await expect(page.getByText('Não há registos neste período.')).toBeVisible()
  await shot(page, '13-audit-empty')
})

test('legal documents and verification document types', async ({ page }) => {
  await page.goto(`${ADMIN_URL}/settings/legal`)
  await expect(page.getByText(/Em vigor: versão \d+/)).toBeVisible()
  await shot(page, '14-legal')
  await page.goto(`${ADMIN_URL}/settings/document-types`)
  await expect(page.getByRole('cell', { name: 'Certificado da formação da Academia' })).toBeVisible()
  await shot(page, '15-document-types')
})
