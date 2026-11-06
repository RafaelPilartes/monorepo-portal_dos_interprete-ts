import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { expect, test, type Browser, type Page } from '@playwright/test'
import { ADMIN_URL, apiAs, createConfirmedUser, INTERPRETER_URL, REQUESTER_URL, repoRoot, sqlLocal } from '../local'

// Step H9 in the browser (MASTER-PLAN H9: as duas partes avaliam e veem ao mesmo tempo; reviews.md),
// and a moderator hides a review on the account sheet (R-REV-04).

test.describe.configure({ mode: 'serial' })

const evidence = path.join(repoRoot, 'docs/plan/evidence/H9')
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

type User = Awaited<ReturnType<typeof createConfirmedUser>>
let interpreter: User
let requester: User
let interpreterName = ''

test.beforeAll(async () => {
  const stamp = Date.now().toString(36)
  interpreterName = `Ivo Avalia ${stamp}`
  interpreter = await createConfirmedUser(interpreterName)
  requester = await createConfirmedUser(`Rita Avalia ${stamp}`)
  for (const user of [interpreter, requester]) {
    sqlLocal(`INSERT INTO identity.consents (account_id, legal_document_id)
              SELECT '${user.id}', d.id FROM auth_helper.pending_legal_documents('${user.id}') AS d`)
  }
  await apiAs(interpreter.accessToken, 'POST', '/onboarding/interpreter', {})
  await apiAs(requester.accessToken, 'POST', '/onboarding/requester', {})
  // Test setup: a complete online profile (H4's screens).
  sqlLocal(`UPDATE identity.interpreter_profiles SET modality = 'online',
              bio = repeat('Intérprete de Língua Gestual Angolana em consultas e tribunais. ', 2) WHERE account_id = '${interpreter.id}';
            INSERT INTO directory.interpreter_languages (interpreter_id, language_id, level)
            SELECT '${interpreter.id}', id, 'fluent' FROM catalog.languages WHERE code = 'lga';
            INSERT INTO directory.interpreter_services (interpreter_id, service_id, price_aoa)
            SELECT '${interpreter.id}', id, 10000 FROM catalog.services WHERE active AND pricing_mode = 'hourly' ORDER BY sort LIMIT 1;`)
})

/** An accepted direct request (through the routes the screens call, H5 tests them). */
async function acceptedRequest(startsInHours: number): Promise<{ id: string; assignment: string }> {
  const service = sqlLocal("SELECT id FROM catalog.services WHERE active AND pricing_mode = 'hourly' ORDER BY sort LIMIT 1")
  const language = sqlLocal("SELECT id FROM catalog.languages WHERE code = 'lga'")
  const created = await apiAs<{ id: string }>(requester.accessToken, 'POST', '/requests', {
    kind: 'direct', service_id: service, language_ids: [language], modality: 'online', meeting_link: 'https://meet.exemplo.ao/c',
    starts_at: new Date(Date.now() + startsInHours * 3600_000).toISOString(), duration_minutes: 60, interpreters_needed: 1,
    interpreter_ids: [interpreter.id], expected_total_aoa: 10000,
  })
  const assignment = sqlLocal(`SELECT id FROM booking.request_assignments WHERE request_id = '${created.id}'`)
  await apiAs(interpreter.accessToken, 'POST', `/assignments/${assignment}/accept`, {})
  return { id: created.id, assignment }
}

/** Test setup only: the hour-long service ended `endedHoursAgo` ago (no screen moves time; triggers off for the move). */
function moveToPast(requestId: string, endedHoursAgo: number): void {
  sqlLocal(`SET session_replication_role = replica;
            UPDATE booking.requests SET starts_at = now() - interval '${endedHoursAgo + 1} hours', ends_at = now() - interval '${endedHoursAgo} hours'
             WHERE id = '${requestId}';`)
}

test('both sides review; each review shows only once both are in (R-REV-01, R-REV-02)', async ({ browser }) => {
  const request = await acceptedRequest(30)
  moveToPast(request.id, 2)
  await apiAs(interpreter.accessToken, 'POST', `/assignments/${request.assignment}/deliver`, {})
  await apiAs(requester.accessToken, 'POST', `/assignments/${request.assignment}/confirm`, {})

  const requesterPage = await freshPage(browser)
  await signIn(requesterPage, REQUESTER_URL, requester)
  await requesterPage.goto(`${REQUESTER_URL}/reviews`)
  await expect(requesterPage.getByText(`Avalia o teu serviço com ${interpreterName}`)).toBeVisible()
  await requesterPage.getByRole('button', { name: 'Enviar avaliação' }).click()
  await expect(requesterPage.getByText('Escolhe de 1 a 5 estrelas.')).toBeVisible()
  await requesterPage.getByRole('button', { name: '5 estrelas' }).click()
  await requesterPage.getByLabel('Comentário (opcional)').fill('Muito profissional e pontual.')
  await requesterPage.getByRole('button', { name: 'Enviar avaliação' }).click()
  await expect(requesterPage.getByText(`Obrigado. A tua avaliação fica visível quando ${interpreterName} também avaliar, ou daqui a 14 dias.`)).toBeVisible()
  await shot(requesterPage, '01-requester-reviewed')

  // Before giving its own, the interpreter does not see the requester's review.
  const interpreterPage = await freshPage(browser)
  await signIn(interpreterPage, INTERPRETER_URL, interpreter)
  await interpreterPage.goto(`${INTERPRETER_URL}/reviews`)
  await interpreterPage.getByRole('tab', { name: 'Que recebi' }).click()
  await expect(interpreterPage.getByText('Ainda não recebeste avaliações visíveis.')).toBeVisible()
  await shot(interpreterPage, '02-interpreter-nothing-yet')
  await interpreterPage.goto(`${INTERPRETER_URL}/requests/${request.id}`)
  await interpreterPage.getByRole('button', { name: '4 estrelas' }).click()
  await interpreterPage.getByRole('button', { name: 'Enviar avaliação' }).click()
  await expect(interpreterPage.getByText(/as duas avaliações estão visíveis/)).toBeVisible()

  // Both are now visible, to both.
  await interpreterPage.goto(`${INTERPRETER_URL}/reviews`)
  await interpreterPage.getByRole('tab', { name: 'Que recebi' }).click()
  await expect(interpreterPage.getByText('Muito profissional e pontual.')).toBeVisible()
  await shot(interpreterPage, '03-interpreter-received')
  await requesterPage.goto(`${REQUESTER_URL}/reviews`)
  await requesterPage.getByRole('tab', { name: 'Que recebi' }).click()
  await expect(requesterPage.getByLabel('4 de 5 estrelas')).toBeVisible()
  await shot(requesterPage, '04-requester-received')
  await requesterPage.goto(`${REQUESTER_URL}/interpreters/${sqlLocal(`SELECT slug FROM identity.interpreter_profiles WHERE account_id = '${interpreter.id}'`)}`)
  await expect(requesterPage.getByText('(1 avaliação)').first()).toBeVisible()
  await shot(requesterPage, '05-profile-rating')
})

test('a moderator hides a review on the account sheet; it leaves the average (R-REV-04, criterion 5)', async ({ browser }) => {
  const admin = await browser.newContext({ storageState: path.join(repoRoot, 'tests/e2e/test-results/admin-state.json'), viewport: { width: 1280, height: 1000 } })
  const adminPage = await admin.newPage()
  await adminPage.goto(`${ADMIN_URL}/interpreters/${interpreter.id}`)
  await expect(adminPage.getByText('Muito profissional e pontual.')).toBeVisible()
  await adminPage.getByRole('button', { name: 'Esconder' }).first().click()
  await adminPage.getByLabel('Motivo').fill('Contém dados pessoais do beneficiário.')
  await adminPage.getByRole('dialog').getByRole('button', { name: 'Esconder' }).click()
  await expect(adminPage.getByText('Avaliação escondida. O autor foi avisado.')).toBeVisible()
  await expect(adminPage.getByText(/Escondida pela equipa: Contém dados pessoais do beneficiário\./)).toBeVisible()
  await shot(adminPage, '06-admin-hidden')
  expect(sqlLocal(`SELECT count(*) FROM directory.interpreter_ratings WHERE interpreter_id = '${interpreter.id}'`)).toBe('0')
})
