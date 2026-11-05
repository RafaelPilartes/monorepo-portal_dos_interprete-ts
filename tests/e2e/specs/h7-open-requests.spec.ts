import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { expect, test, type Browser, type Page } from '@playwright/test'
import { apiAs, createConfirmedUser, INTERPRETER_URL, REQUESTER_URL, repoRoot, sqlLocal } from '../local'

// Step H7 in the browser (MASTER-PLAN H7: os dois modos de ponta a ponta). The concurrent
// criterion is in apps/api/src/routes/requests.db.test.ts.

test.describe.configure({ mode: 'serial' })

const evidence = path.join(repoRoot, 'docs/plan/evidence/H7')
mkdirSync(evidence, { recursive: true })
async function shot(page: Page, name: string): Promise<void> {
  await page.waitForTimeout(400)
  await page.screenshot({ path: path.join(evidence, `${name}.jpg`), type: 'jpeg', quality: 75 })
}

async function freshPage(browser: Browser): Promise<Page> {
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] }, viewport: { width: 1280, height: 950 } })
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

let requesterPage: Page
let interpreterPage: Page
let requester: Awaited<ReturnType<typeof createConfirmedUser>>
const stamp = Date.now().toString(36)

test.beforeAll(async ({ browser }) => {
  const interpreter = await createConfirmedUser(`Tó Aberto ${stamp}`)
  requester = await createConfirmedUser('Rita Aberta')
  for (const user of [interpreter, requester]) acceptTerms(user.id)
  await apiAs(interpreter.accessToken, 'POST', '/onboarding/interpreter', {})
  await apiAs(requester.accessToken, 'POST', '/onboarding/requester', {})
  // Test setup: a complete online profile at 10 000 Kz per hour (H4's screens).
  sqlLocal(`UPDATE identity.interpreter_profiles SET modality = 'online',
              bio = repeat('Intérprete de Língua Gestual Angolana em consultas e tribunais. ', 2) WHERE account_id = '${interpreter.id}';
            INSERT INTO directory.interpreter_languages (interpreter_id, language_id, level)
            SELECT '${interpreter.id}', id, 'fluent' FROM catalog.languages WHERE code = 'lga';
            INSERT INTO directory.interpreter_services (interpreter_id, service_id, price_aoa)
            SELECT '${interpreter.id}', id, 10000 FROM catalog.services WHERE active AND pricing_mode = 'hourly' ORDER BY sort LIMIT 1;`)
  requesterPage = await freshPage(browser)
  interpreterPage = await freshPage(browser)
  await signIn(requesterPage, REQUESTER_URL, requester)
  await signIn(interpreterPage, INTERPRETER_URL, interpreter)
})

test('"I choose": the requester publishes, the interpreter applies, the requester chooses (R-OPN-03, R-OPN-04)', async () => {
  const page = requesterPage
  await page.goto(`${REQUESTER_URL}/requests/new`)
  await page.getByRole('button', { name: /Publicar para intérpretes/ }).click()
  await page.getByRole('button', { name: /Eu escolho/ }).click()
  await shot(page, '01-wizard-open-mode')
  await page.getByRole('button', { name: 'Seguinte' }).click()
  await page.getByLabel('Serviço').click()
  await page.getByRole('option').first().click()
  await page.getByRole('button', { name: 'Língua Gestual Angolana' }).click()
  await page.getByRole('button', { name: 'Seguinte' }).click()
  await page.getByRole('button', { name: /Online/ }).click()
  await page.getByRole('button', { name: 'Seguinte' }).click()
  await page.getByLabel('Dia').fill(new Date(Date.now() + 5 * 24 * 3600_000).toISOString().slice(0, 10))
  await page.getByLabel('Hora (hora de Luanda)').fill('15:00')
  await page.getByLabel('Duração (minutos)').fill('60')
  await page.getByRole('button', { name: 'Seguinte' }).click()
  await page.getByLabel('Link da reunião').fill('https://meet.exemplo.ao/aberto')
  await page.getByRole('button', { name: 'Seguinte' }).click()
  await expect(page.getByText('Cada intérprete candidata-se com o seu preço.')).toBeVisible()
  await page.getByRole('button', { name: 'Enviar pedido' }).click()
  await expect(page.getByText(/Pedido PI-\d{4}-\d{6} enviado/)).toBeVisible()
  await expect(page.getByText('Ainda não há candidaturas.')).toBeVisible()
  const requestPath = new URL(page.url()).pathname
  await shot(page, '02-open-request-published')

  await interpreterPage.goto(`${INTERPRETER_URL}/open-requests`)
  await expect(interpreterPage.getByText('10 000 Kz', { exact: true })).toBeVisible()
  await shot(interpreterPage, '03-open-requests-for-me')
  await interpreterPage.getByRole('button', { name: 'Candidatar-me' }).click()
  await interpreterPage.getByLabel('Mensagem para o solicitante (opcional)').fill('Tenho experiência neste tipo de serviço.')
  await interpreterPage.getByRole('button', { name: 'Enviar candidatura' }).click()
  await expect(interpreterPage.getByText('Candidatura enviada. O solicitante foi avisado.')).toBeVisible()
  await expect(interpreterPage.getByText('Não há pedidos abertos para ti neste momento.')).toBeVisible()

  await page.goto(`${REQUESTER_URL}${requestPath}`)
  await expect(page.getByText('Candidatou-se: «Tenho experiência neste tipo de serviço.»')).toBeVisible()
  await shot(page, '04-requester-candidates')
  await page.getByRole('button', { name: 'Escolher' }).click()
  await expect(page.getByText('Intérprete escolhido.')).toBeVisible()
  await expect(page.getByText('Confirmado', { exact: true }).first()).toBeVisible()
  await shot(page, '05-requester-chosen-confirmed')
})

test('"first to accept": the interpreter takes the place at the budget, everything included (R-OPN-02)', async () => {
  const service = sqlLocal("SELECT id FROM catalog.services WHERE active AND pricing_mode = 'hourly' ORDER BY sort LIMIT 1")
  const language = sqlLocal("SELECT id FROM catalog.languages WHERE code = 'lga'")
  // Test setup: published through the same route as the wizard (the wizard's open mode is the test above).
  const created = await apiAs<{ id: string }>(requester.accessToken, 'POST', '/requests', {
    kind: 'open', open_mode: 'first_accept', budget_per_interpreter_aoa: 9000, service_id: service, language_ids: [language],
    modality: 'online', meeting_link: 'https://meet.exemplo.ao/primeiro', starts_at: new Date(Date.now() + 8 * 24 * 3600_000).toISOString(),
    duration_minutes: 60, interpreters_needed: 1, interpreter_ids: [], expected_total_aoa: 9000,
  })
  await interpreterPage.goto(`${INTERPRETER_URL}/open-requests`)
  await expect(interpreterPage.getByText('tudo incluído')).toBeVisible()
  await expect(interpreterPage.getByText('9 000 Kz', { exact: true })).toBeVisible()
  await shot(interpreterPage, '06-first-accept-offer')
  await interpreterPage.getByRole('button', { name: 'Aceitar' }).click()
  await expect(interpreterPage.getByText('Pedido aceite. O lugar é teu.')).toBeVisible()
  await expect(interpreterPage.getByText('Não há pedidos abertos para ti neste momento.')).toBeVisible()

  await requesterPage.goto(`${REQUESTER_URL}/requests/${created.id}`)
  await expect(requesterPage.getByText('Confirmado', { exact: true }).first()).toBeVisible()
  await expect(requesterPage.getByText('9 000 Kz', { exact: true })).toBeVisible()
  await shot(requesterPage, '07-first-accept-confirmed')
})
