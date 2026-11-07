import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { expect, test, type Browser, type Page } from '@playwright/test'
import { ADMIN_URL, apiAs, createConfirmedUser, INTERPRETER_URL, REQUESTER_URL, repoRoot, sqlLocal } from '../local'

// Step H8 in the browser (MASTER-PLAN H8: feito → confirmado; disputa → resolvida no admin; and the
// late warning before a cancellation, service-lifecycle.md "Ecrãs").

test.describe.configure({ mode: 'serial' })

const evidence = path.join(repoRoot, 'docs/plan/evidence/H8')
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

test.beforeAll(async () => {
  const stamp = Date.now().toString(36)
  interpreter = await createConfirmedUser(`Ivo Ciclo ${stamp}`)
  requester = await createConfirmedUser(`Rita Ciclo ${stamp}`)
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

test('the interpreter marks as done after the end; the requester confirms; the request completes (R-LIFE-03, R-LIFE-04)', async ({ browser }) => {
  const request = await acceptedRequest(30)
  moveToPast(request.id, 2)
  const interpreterPage = await freshPage(browser)
  await signIn(interpreterPage, INTERPRETER_URL, interpreter)
  await interpreterPage.goto(`${INTERPRETER_URL}/schedule`)
  await expect(interpreterPage.getByText('Por marcar como feitos')).toBeVisible()
  await shot(interpreterPage, '01-interpreter-schedule-to-mark')
  await interpreterPage.goto(`${INTERPRETER_URL}/requests/${request.id}`)
  await interpreterPage.getByRole('button', { name: 'Marcar como feito' }).click()
  await expect(interpreterPage.getByText('Marcado como feito. O solicitante foi avisado.')).toBeVisible()
  await expect(interpreterPage.getByText(/Sem resposta do solicitante, fica confirmado a/)).toBeVisible()
  await shot(interpreterPage, '02-interpreter-delivered')

  const requesterPage = await freshPage(browser)
  await signIn(requesterPage, REQUESTER_URL, requester)
  await requesterPage.goto(`${REQUESTER_URL}/requests/${request.id}`)
  await expect(requesterPage.getByText(/Sem resposta, fica confirmado a/)).toBeVisible()
  await shot(requesterPage, '03-requester-delivered')
  await requesterPage.getByRole('button', { name: 'Confirmar que o serviço foi feito' }).click()
  await expect(requesterPage.getByText('Serviço confirmado.')).toBeVisible()
  await expect(requesterPage.getByText('Concluído').first()).toBeVisible()
  expect(sqlLocal(`SELECT status || ' ' || (SELECT completed_via FROM booking.request_assignments WHERE request_id = r.id) FROM booking.requests AS r WHERE id = '${request.id}'`))
    .toBe('completed requester')
  await shot(requesterPage, '04-requester-completed')
})

test('the requester opens a dispute; a moderator resolves it in admin-web (R-LIFE-05, R-LIFE-06)', async ({ browser }) => {
  const request = await acceptedRequest(40)
  moveToPast(request.id, 5)
  await apiAs(interpreter.accessToken, 'POST', `/assignments/${request.assignment}/deliver`, {})

  const requesterPage = await freshPage(browser)
  await signIn(requesterPage, REQUESTER_URL, requester)
  await requesterPage.goto(`${REQUESTER_URL}/requests/${request.id}`)
  await requesterPage.getByRole('button', { name: 'Abrir disputa' }).click()
  await requesterPage.getByLabel('Motivo').fill('O intérprete saiu a meio da consulta.')
  await requesterPage.getByRole('dialog').getByRole('button', { name: 'Abrir disputa' }).click()
  await expect(requesterPage.getByText('Disputa aberta. A equipa vai analisar.')).toBeVisible()
  await expect(requesterPage.getByText('Disputa aberta', { exact: true })).toBeVisible()
  await shot(requesterPage, '05-requester-dispute-open')

  const admin = await browser.newContext({ storageState: path.join(repoRoot, 'tests/e2e/test-results/admin-state.json'), viewport: { width: 1280, height: 1000 } })
  const adminPage = await admin.newPage()
  await adminPage.goto(`${ADMIN_URL}/requests`)
  await adminPage.getByRole('button', { name: 'Em disputa' }).click()
  await adminPage.locator(`a[href="/requests/${request.id}"]`).click()
  await expect(adminPage.getByText('«O intérprete saiu a meio da consulta.»', { exact: false })).toBeVisible()
  await shot(adminPage, '06-admin-dispute')
  await adminPage.getByRole('button', { name: 'Resolver' }).click()
  await adminPage.getByLabel('O serviço conta como feito').check()
  await adminPage.getByLabel('Notas (as partes leem)').fill('A consulta terminou com outro intérprete da clínica; o serviço conta.')
  await adminPage.getByRole('dialog').getByRole('button', { name: 'Resolver' }).click()
  await expect(adminPage.getByText('Disputa resolvida. As duas partes foram avisadas.')).toBeVisible()
  await expect(adminPage.getByText('Disputa resolvida: o serviço conta como feito')).toBeVisible()
  expect(sqlLocal(`SELECT status FROM booking.requests WHERE id = '${request.id}'`)).toBe('completed')
  await shot(adminPage, '07-admin-resolved')
})

test('cancelling less than 24 hours before warns that it stays on the profile (D-22)', async ({ browser }) => {
  const request = await acceptedRequest(20)
  const requesterPage = await freshPage(browser)
  await signIn(requesterPage, REQUESTER_URL, requester)
  await requesterPage.goto(`${REQUESTER_URL}/requests/${request.id}`)
  await requesterPage.getByRole('button', { name: 'Cancelar pedido' }).click()
  await expect(requesterPage.getByText('Faltam menos de 24 horas: este cancelamento fica registado no teu perfil.')).toBeVisible()
  await requesterPage.getByLabel('Motivo').fill('A consulta foi adiada pelo hospital.')
  await shot(requesterPage, '08-requester-late-warning')
  await requesterPage.getByRole('dialog').getByRole('button', { name: 'Cancelar o pedido' }).click()
  await expect(requesterPage.getByText('Pedido cancelado. Os intérpretes foram avisados.')).toBeVisible()
  expect(sqlLocal(`SELECT late_cancellation FROM booking.request_assignments WHERE id = '${request.assignment}'`)).toBe('t')
})
