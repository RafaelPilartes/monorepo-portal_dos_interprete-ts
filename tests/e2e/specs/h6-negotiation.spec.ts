import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { expect, test, type Browser, type Page } from '@playwright/test'
import { apiAs, createConfirmedUser, INTERPRETER_URL, REQUESTER_URL, repoRoot, sqlLocal } from '../local'

// Step H6 in the browser (MASTER-PLAN H6: proposta → contraproposta → aceitar → intérprete aceita
// o pedido ao preço negociado).

test.describe.configure({ mode: 'serial' })

const evidence = path.join(repoRoot, 'docs/plan/evidence/H6')
mkdirSync(evidence, { recursive: true })
async function shot(page: Page, name: string): Promise<void> {
  await page.waitForTimeout(400)
  await page.screenshot({ path: path.join(evidence, `${name}.jpg`), type: 'jpeg', quality: 75 })
}

async function freshPage(browser: Browser): Promise<Page> {
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] }, viewport: { width: 1280, height: 1000 } })
  return context.newPage()
}

function acceptTerms(accountId: string): void {
  sqlLocal(`INSERT INTO identity.consents (account_id, legal_document_id)
            SELECT '${accountId}', d.id FROM auth_helper.pending_legal_documents('${accountId}') AS d`)
}

async function signIn(page: Page, url: string, user: { email: string; password: string }): Promise<void> {
  await page.goto(`${url}/login`)
  await page.getByLabel('Email', { exact: true }).fill(user.email)
  await page.getByLabel('Palavra-passe', { exact: true }).fill(user.password)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).not.toHaveURL(`${url}/login`)
}

test('proposal, counter-proposal, accepted; the interpreter accepts the request at the negotiated price (negotiation.md)', async ({ browser }) => {
  const stamp = Date.now().toString(36)
  const interpreter = await createConfirmedUser(`Ivo Negocia ${stamp}`)
  const requester = await createConfirmedUser('Rita Negocia')
  for (const user of [interpreter, requester]) acceptTerms(user.id)
  await apiAs(interpreter.accessToken, 'POST', '/onboarding/interpreter', {})
  await apiAs(requester.accessToken, 'POST', '/onboarding/requester', {})
  // Test setup: a complete online profile at 15 000 Kz per hour (H4's screens).
  sqlLocal(`UPDATE identity.interpreter_profiles SET modality = 'online',
              bio = repeat('Intérprete de Língua Gestual Angolana em consultas e tribunais. ', 2) WHERE account_id = '${interpreter.id}';
            INSERT INTO directory.interpreter_languages (interpreter_id, language_id, level)
            SELECT '${interpreter.id}', id, 'fluent' FROM catalog.languages WHERE code = 'lga';
            INSERT INTO directory.interpreter_services (interpreter_id, service_id, price_aoa)
            SELECT '${interpreter.id}', id, 15000 FROM catalog.services WHERE active AND pricing_mode = 'hourly' ORDER BY sort LIMIT 1;`)
  const service = sqlLocal("SELECT id FROM catalog.services WHERE active AND pricing_mode = 'hourly' ORDER BY sort LIMIT 1")
  const language = sqlLocal("SELECT id FROM catalog.languages WHERE code = 'lga'")
  // Test setup: the request through the same route the wizard calls (H5 tests the wizard).
  const created = await apiAs<{ id: string }>(requester.accessToken, 'POST', '/requests', {
    kind: 'direct', service_id: service, language_ids: [language], modality: 'online', meeting_link: 'https://meet.exemplo.ao/x',
    starts_at: new Date(Date.now() + 6 * 24 * 3600_000).toISOString(), duration_minutes: 60, interpreters_needed: 1,
    interpreter_ids: [interpreter.id], expected_total_aoa: 15000,
  })

  const requesterPage = await freshPage(browser)
  const interpreterPage = await freshPage(browser)
  await signIn(requesterPage, REQUESTER_URL, requester)
  await signIn(interpreterPage, INTERPRETER_URL, interpreter)

  // The requester proposes 12 000; a zero is refused on the field.
  await requesterPage.goto(`${REQUESTER_URL}/requests/${created.id}`)
  await requesterPage.getByRole('button', { name: 'Propor outro preço' }).click()
  await requesterPage.getByLabel('Novo valor, em kwanzas, sem a deslocação').fill('0')
  await requesterPage.getByRole('button', { name: 'Enviar proposta' }).click()
  await expect(requesterPage.getByText('Indica um valor maior que zero, em kwanzas.')).toBeVisible()
  await requesterPage.getByLabel('Novo valor, em kwanzas, sem a deslocação').fill('12000')
  await requesterPage.getByRole('button', { name: 'Enviar proposta' }).click()
  await expect(requesterPage.getByText('A tua proposta')).toBeVisible()
  await shot(requesterPage, '01-requester-proposal')

  // The interpreter counters with 13 500: the first becomes "Substituída".
  await interpreterPage.goto(`${INTERPRETER_URL}/requests/${created.id}`)
  await expect(interpreterPage.getByText('Proposta de Rita Negocia')).toBeVisible()
  await interpreterPage.getByRole('button', { name: 'Propor outro preço' }).click()
  await interpreterPage.getByLabel('Novo valor, em kwanzas, sem a deslocação').fill('13500')
  await interpreterPage.getByRole('button', { name: 'Enviar proposta' }).click()
  await expect(interpreterPage.getByText('Substituída por uma nova proposta')).toBeVisible()
  await shot(interpreterPage, '02-interpreter-counter')

  // The requester accepts the counter-proposal.
  await requesterPage.reload()
  await requesterPage.getByRole('button', { name: 'Aceitar proposta' }).click()
  await expect(requesterPage.getByText('Proposta aceite: é o novo preço proposto.')).toBeVisible()
  await expect(requesterPage.getByText('13 500 Kz', { exact: true }).first()).toBeVisible()
  await shot(requesterPage, '03-requester-accepted-proposal')

  // The interpreter accepts the request at 13 500; the negotiation closes.
  await interpreterPage.reload()
  await expect(interpreterPage.getByText('13 500 Kz', { exact: true }).first()).toBeVisible()
  await interpreterPage.getByRole('button', { name: 'Aceitar', exact: true }).click()
  await expect(interpreterPage.getByText('Pedido aceite. O solicitante foi avisado.')).toBeVisible()
  await expect(interpreterPage.getByText('A negociação está fechada.')).toBeVisible()
  await shot(interpreterPage, '04-interpreter-accepted-at-negotiated-price')
  const agreed = sqlLocal(`SELECT agreed_price_aoa FROM booking.request_assignments WHERE request_id = '${created.id}'`)
  expect(agreed).toBe('13500')
})
