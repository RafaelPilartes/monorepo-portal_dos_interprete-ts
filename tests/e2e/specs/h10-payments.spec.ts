import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { expect, test, type Browser, type Page } from '@playwright/test'
import { ADMIN_URL, apiAs, createConfirmedUser, REQUESTER_URL, repoRoot, sqlLocal } from '../local'

// Step H10 in the browser (MASTER-PLAN H10: enviar → recusar → reenviar → aceitar → recibo), seen
// on the payer's screen and on finance's. The intent is created by fixture: its subjects (managed
// request, verification, event) arrive with H11, H12 and H17.

test.describe.configure({ mode: 'serial' })

const evidence = path.join(repoRoot, 'docs/plan/evidence/H10')
mkdirSync(evidence, { recursive: true })
async function shot(page: Page, name: string): Promise<void> {
  await page.waitForTimeout(400)
  await page.screenshot({ path: path.join(evidence, `${name}.jpg`), type: 'jpeg', quality: 75 })
}

async function freshPage(browser: Browser): Promise<Page> {
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] }, viewport: { width: 1280, height: 1000 } })
  return context.newPage()
}

async function signIn(page: Page, url: string, user: { email: string; password: string }): Promise<void> {
  await page.goto(`${url}/login`)
  await page.getByLabel('Email', { exact: true }).fill(user.email)
  await page.getByLabel('Palavra-passe', { exact: true }).fill(user.password)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).not.toHaveURL(`${url}/login`)
}

const pdf = (name: string) => ({ name, mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n% comprovativo de teste\n%%EOF\n') })

test('send, refuse, send again, accept, receipt: on the payer\'s screen and on finance\'s (criterion 7)', async ({ browser }) => {
  const stamp = Date.now().toString(36)
  const payer = await createConfirmedUser(`Paula Paga ${stamp}`)
  sqlLocal(`INSERT INTO identity.consents (account_id, legal_document_id)
            SELECT '${payer.id}', d.id FROM auth_helper.pending_legal_documents('${payer.id}') AS d`)
  await apiAs(payer.accessToken, 'POST', '/onboarding/requester', {})
  // Test setup: an intent as billing.create_intent leaves it, with fictitious bank data (PC-06).
  const reference = sqlLocal(`INSERT INTO billing.payment_intents (context, subject_id, payer_account, description, amount_base_aoa, tax_aoa,
      amount_total_aoa, config_version_id, reference, bank_snapshot, due_at)
    VALUES ('managed_request', gen_random_uuid(), '${payer.id}', 'Pedido gerido de teste', 30000, 0, 30000, config.current_version_id(),
      util.next_code('PAG'), '{"bank_name": "Banco de Teste", "iban": "AO06000000000000000000001", "beneficiary": "Academia (teste)"}',
      now() + interval '2 days')
    RETURNING reference`).split('\n')[0]!

  const payerPage = await freshPage(browser)
  await signIn(payerPage, REQUESTER_URL, payer)
  await payerPage.goto(`${REQUESTER_URL}/payments`)
  await expect(payerPage.getByText(reference)).toBeVisible()
  await expect(payerPage.getByText('À espera do comprovativo')).toBeVisible()
  await shot(payerPage, '01-payer-awaiting')
  await payerPage.getByLabel('Ficheiro do comprovativo').setInputFiles(pdf('transferencia.pdf'))
  await expect(payerPage.getByText('Comprovativo enviado. A equipa vai validar.')).toBeVisible()
  await expect(payerPage.getByText('Comprovativo em análise')).toBeVisible()

  const admin = await browser.newContext({ storageState: path.join(repoRoot, 'tests/e2e/test-results/admin-state.json'), viewport: { width: 1280, height: 1000 } })
  const adminPage = await admin.newPage()
  await adminPage.goto(`${ADMIN_URL}/payments`)
  const card = adminPage.locator('li').filter({ hasText: reference })
  await expect(card).toBeVisible()
  await shot(adminPage, '02-finance-queue')
  await card.getByRole('button', { name: 'Recusar' }).click()
  await adminPage.getByLabel('Motivo').fill('O valor transferido não corresponde: 3 000 Kz')
  await adminPage.getByRole('dialog').getByRole('button', { name: 'Recusar' }).click()
  await expect(adminPage.getByText('Comprovativo recusado. O pagador foi avisado.')).toBeVisible()

  await payerPage.reload()
  await expect(payerPage.getByText('Recusado: O valor transferido não corresponde: 3 000 Kz', { exact: false })).toBeVisible()
  await shot(payerPage, '03-payer-refused')
  await payerPage.getByLabel('Ficheiro do comprovativo').setInputFiles(pdf('transferencia-certa.pdf'))
  await expect(payerPage.getByText('Comprovativo em análise')).toBeVisible()

  await adminPage.reload()
  await adminPage.locator('li').filter({ hasText: reference }).getByRole('button', { name: 'Aceitar' }).click()
  await expect(adminPage.getByText('Pagamento confirmado. O recibo foi emitido.')).toBeVisible()
  await adminPage.getByRole('button', { name: 'Histórico' }).click()
  await expect(adminPage.locator('li').filter({ hasText: reference }).filter({ hasText: 'Aceite por' })).toBeVisible()
  await shot(adminPage, '04-finance-history')

  await payerPage.reload()
  await expect(payerPage.getByText('Pago', { exact: true })).toBeVisible()
  const receipt = payerPage.getByRole('button', { name: /^Recibo RC-/ })
  await expect(receipt).toBeVisible()
  const download = payerPage.waitForEvent('download')
  await receipt.click()
  expect((await download).suggestedFilename()).toMatch(/^RC-\d{4}-\d{6}\.pdf$/)
  await shot(payerPage, '05-payer-paid-receipt')
})
