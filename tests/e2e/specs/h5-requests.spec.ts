import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { expect, test, type Browser, type Page } from '@playwright/test'
import { apiAs, createConfirmedUser, INTERPRETER_URL, REQUESTER_URL, repoRoot, sqlLocal } from '../local'

// Step H5 in the browser (MASTER-PLAN H5: solicitante cria directo → intérprete aceita → os
// dois conversam no chat → ambos veem `confirmed`), with the bell and the price on the review.

test.describe.configure({ mode: 'serial' })

const evidence = path.join(repoRoot, 'docs/plan/evidence/H5')
mkdirSync(evidence, { recursive: true })
async function shot(page: Page, name: string): Promise<void> {
  await page.waitForTimeout(400)
  await page.screenshot({ path: path.join(evidence, `${name}.jpg`), type: 'jpeg', quality: 75 })
}

const stamp = Date.now().toString(36)
const interpreterName = `Ivo Pedidos ${stamp}`

async function freshPage(browser: Browser): Promise<Page> {
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] }, viewport: { width: 1280, height: 900 } })
  return context.newPage()
}

/** Test setup: the documents in force accepted, as /accept-terms does (H2 tests it). */
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

let requesterPage: Page
let interpreterPage: Page
let requestUrl = ''

test('the requester creates a direct request; the review shows the total from the server (R-REQ-01, R-REQ-02)', async ({ browser }) => {
  const interpreter = await createConfirmedUser(interpreterName)
  const requester = await createConfirmedUser('Rita Pedidos')
  for (const user of [interpreter, requester]) acceptTerms(user.id)
  await apiAs(interpreter.accessToken, 'POST', '/onboarding/interpreter', {})
  await apiAs(requester.accessToken, 'POST', '/onboarding/requester', {})
  // Test setup: a complete profile, 8000 Kz per hour for the first hourly service (H4's screens).
  sqlLocal(`UPDATE identity.interpreter_profiles SET modality = 'both', city = 'Luanda', travel_fee_aoa = 1500,
              bio = repeat('Intérprete de Língua Gestual Angolana em consultas e tribunais. ', 2) WHERE account_id = '${interpreter.id}';
            INSERT INTO directory.interpreter_languages (interpreter_id, language_id, level)
            SELECT '${interpreter.id}', id, 'fluent' FROM catalog.languages WHERE code = 'lga';
            INSERT INTO directory.interpreter_services (interpreter_id, service_id, price_aoa)
            SELECT '${interpreter.id}', id, 8000 FROM catalog.services WHERE active AND pricing_mode = 'hourly' ORDER BY sort LIMIT 1;`)

  requesterPage = await freshPage(browser)
  interpreterPage = await freshPage(browser)
  await signIn(requesterPage, REQUESTER_URL, requester)
  await signIn(interpreterPage, INTERPRETER_URL, interpreter)

  const page = requesterPage
  await page.goto(`${REQUESTER_URL}/requests`)
  await expect(page.getByText('Ainda não fizeste nenhum pedido')).toBeVisible()
  await shot(page, '01-requests-empty')
  await page.getByRole('link', { name: 'Fazer um pedido' }).click()
  await shot(page, '02-wizard-kind')
  await page.getByRole('button', { name: 'Seguinte' }).click()

  // Step 2: each field says what is missing.
  await page.getByRole('button', { name: 'Seguinte' }).click()
  await expect(page.getByText('Escolhe o serviço.')).toBeVisible()
  await page.getByLabel('Serviço').click()
  await page.getByRole('option').first().click()
  await page.getByRole('button', { name: 'Língua Gestual Angolana' }).click()
  await page.getByRole('checkbox', { name: new RegExp(interpreterName) }).check()
  await shot(page, '03-wizard-service-interpreter')
  await page.getByRole('button', { name: 'Seguinte' }).click()

  await page.getByRole('button', { name: /Presencial/ }).click()
  await page.getByRole('button', { name: 'Seguinte' }).click()

  const day = new Date(Date.now() + 4 * 24 * 3600_000).toISOString().slice(0, 10)
  await page.getByLabel('Dia').fill(day)
  await page.getByLabel('Hora (hora de Luanda)').fill('10:00')
  await page.getByLabel('Duração (minutos)').fill('90')
  await page.getByRole('button', { name: 'Seguinte' }).click()

  await page.getByRole('button', { name: 'Seguinte' }).click()
  await expect(page.getByText('Indica a morada do serviço.')).toBeVisible()
  await page.getByLabel('Morada').fill('Rua da Missão, 12')
  await page.getByLabel('Cidade').fill('Luanda')
  await page.getByLabel('Para quem é o serviço (opcional)').fill('Sr. Beneficiário')
  await page.getByRole('button', { name: 'Seguinte' }).click()

  // 90 minutes at 8000/h = 12 000, plus 1 500 travel: 13 500, all from the server.
  await expect(page.getByText('13 500 Kz', { exact: false }).last()).toBeVisible()
  await expect(page.getByText('+ 1 500 Kz de deslocação')).toBeVisible()
  await shot(page, '04-wizard-review')
  await page.getByRole('button', { name: 'Enviar pedido' }).click()
  await expect(page.getByText(/Pedido PI-\d{4}-\d{6} enviado/)).toBeVisible()
  await expect(page.getByText('À espera de intérpretes').first()).toBeVisible()
  requestUrl = new URL(page.url()).pathname
  await shot(page, '05-request-created')
})

test('the interpreter sees the invite with the bell, without the beneficiary, and accepts (R-DRC-03, D-95)', async () => {
  const page = interpreterPage
  await page.goto(`${INTERPRETER_URL}/requests`)
  await expect(page.getByRole('button', { name: /Notificações, \d+ por ler/ })).toBeVisible()
  await page.getByRole('button', { name: /Notificações, \d+ por ler/ }).click()
  await expect(page.getByText('Novo convite para um serviço')).toBeVisible()
  await shot(page, '06-interpreter-bell')
  await page.keyboard.press('Escape')
  await expect(page.getByText(/Responde até/)).toBeVisible()
  await shot(page, '07-interpreter-invites')
  await page.goto(`${INTERPRETER_URL}${requestUrl}`)
  await expect(page.getByText('Sr. Beneficiário')).toHaveCount(0)
  await expect(page.getByText('12 000 Kz + 1 500 Kz de deslocação')).toBeVisible()
  await shot(page, '08-interpreter-invite-detail')
  await page.getByRole('button', { name: 'Aceitar' }).click()
  await expect(page.getByText('Pedido aceite. O solicitante foi avisado.')).toBeVisible()
  await expect(page.getByText('Sr. Beneficiário')).toBeVisible()
  await expect(page.getByText('Rua da Missão, 12')).toBeVisible()
  await shot(page, '09-interpreter-accepted')
})

test('both talk in the chat and both see the request confirmed (MASTER-PLAN H5)', async () => {
  await interpreterPage.getByLabel('Mensagem').fill('Bom dia! Estarei lá 10 minutos antes.')
  await interpreterPage.getByRole('button', { name: 'Enviar' }).click()
  await expect(interpreterPage.getByText('Bom dia! Estarei lá 10 minutos antes.')).toBeVisible()

  const page = requesterPage
  await page.goto(`${REQUESTER_URL}${requestUrl}`)
  await expect(page.getByText('Confirmado', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('Bom dia! Estarei lá 10 minutos antes.')).toBeVisible()
  await page.getByLabel('Mensagem').fill('Obrigada, até lá.')
  await page.getByRole('button', { name: 'Enviar' }).click()
  await expect(page.getByText('Obrigada, até lá.')).toBeVisible()
  await shot(page, '10-requester-confirmed-chat')

  await interpreterPage.goto(`${INTERPRETER_URL}/requests`)
  await interpreterPage.getByRole('tab', { name: /Aceites/ }).click()
  await expect(interpreterPage.getByText('12 000 Kz + 1 500 Kz de deslocação')).toBeVisible()
  await interpreterPage.goto(`${INTERPRETER_URL}${requestUrl}`)
  await expect(interpreterPage.getByText('Obrigada, até lá.')).toBeVisible({ timeout: 15_000 })
  await shot(interpreterPage, '11-interpreter-chat')

  await page.goto(`${REQUESTER_URL}/notifications`)
  await expect(page.getByText(/aceitou o pedido/)).toBeVisible()
  await expect(page.getByText('Pedido confirmado')).toBeVisible()
  await shot(page, '12-requester-notifications')
})

test('a request that does not exist says so', async () => {
  await requesterPage.goto(`${REQUESTER_URL}/requests/00000000-0000-4000-8000-000000000000`)
  await expect(requesterPage.getByText('Não encontrámos este pedido.')).toBeVisible()
})
