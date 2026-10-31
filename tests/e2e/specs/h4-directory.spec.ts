import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { expect, test, type Browser, type Page } from '@playwright/test'
import { apiAs, createConfirmedUser, INTERPRETER_URL, REQUESTER_URL, repoRoot, SITE_URL, sqlLocal } from '../local'

// Step H4 in the browser (MASTER-PLAN H4: intérprete completa o perfil → aparece no site →
// visitante é levado ao login → volta ao perfil), plus availability, content and favorites.

test.describe.configure({ mode: 'serial' })

const evidence = path.join(repoRoot, 'docs/plan/evidence/H4')
mkdirSync(evidence, { recursive: true })
async function shot(page: Page, name: string): Promise<void> {
  await page.waitForTimeout(400)
  await page.screenshot({ path: path.join(evidence, `${name}.jpg`), type: 'jpeg', quality: 75 })
}

const stamp = Date.now().toString(36)
const interpreterName = `Dina Teste ${stamp}`

async function freshPage(browser: Browser): Promise<Page> {
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] }, viewport: { width: 1280, height: 800 } })
  return context.newPage()
}

/** Test setup: the documents in force accepted, as the /accept-terms screen does (H2 tests it). */
function acceptTerms(accountId: string): void {
  sqlLocal(`INSERT INTO identity.consents (account_id, legal_document_id)
            SELECT '${accountId}', d.id FROM auth_helper.pending_legal_documents('${accountId}') AS d`)
}

async function signIn(page: Page, url: string, user: { email: string; password: string }): Promise<void> {
  await page.getByLabel('Email', { exact: true }).fill(user.email)
  await page.getByLabel('Palavra-passe', { exact: true }).fill(user.password)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).not.toHaveURL(`${url}/login`)
}

let interpreter: Awaited<ReturnType<typeof createConfirmedUser>>
let interpreterPage: Page
let slug = ''

test('the interpreter sees what is missing, completes the profile and becomes visible (R-DIR-01, criterion 1)', async ({ browser }) => {
  interpreter = await createConfirmedUser(interpreterName)
  acceptTerms(interpreter.id)
  slug = (await apiAs<{ slug: string }>(interpreter.accessToken, 'POST', '/onboarding/interpreter', {})).slug
  interpreterPage = await freshPage(browser)
  const page = interpreterPage
  await page.goto(`${INTERPRETER_URL}/login`)
  await signIn(page, INTERPRETER_URL, interpreter)
  await page.goto(`${INTERPRETER_URL}/profile`)
  await expect(page.getByText('Ainda não visível no directório')).toBeVisible()
  await expect(page.getByRole('link', { name: 'pelo menos um serviço activo com preço' })).toBeVisible()
  await shot(page, '01-profile-missing')

  await page.getByRole('link', { name: 'uma biografia com pelo menos 80 caracteres' }).click()
  await page.getByLabel('Biografia').fill('Intérprete de Língua Gestual Angolana há oito anos, em consultas médicas, tribunais e conferências.')
  await page.getByLabel('Anos de experiência').fill('8')
  await page.getByLabel('Modalidade').click()
  await page.getByRole('option', { name: 'Presencial e online' }).click()
  await page.getByLabel('Cidade').fill('Luanda')
  await page.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.getByText('Alterações guardadas.')).toBeVisible()
  await shot(page, '02-overview')

  await page.goto(`${INTERPRETER_URL}/profile/services`)
  await page.getByLabel('Língua', { exact: true }).click()
  await page.getByRole('option').first().click()
  await page.getByRole('button', { name: 'Acrescentar' }).first().click()
  await expect(page.getByText('Língua acrescentada.')).toBeVisible()
  await page.getByLabel('Serviço', { exact: true }).click()
  await page.getByRole('option').first().click()
  // An empty price is refused on its field, never saved.
  await page.getByRole('button', { name: 'Acrescentar' }).last().click()
  await expect(page.getByText('Preenche este campo.')).toBeVisible()
  await page.getByLabel(/^Preço \(Kz/).last().fill('12000')
  await page.getByRole('button', { name: 'Acrescentar' }).last().click()
  await expect(page.getByText('Serviço acrescentado.')).toBeVisible()
  await shot(page, '03-services')

  await page.goto(`${INTERPRETER_URL}/profile`)
  await expect(page.getByText('Visível no directório', { exact: true })).toBeVisible()
  await shot(page, '04-profile-visible')
})

test('availability and content are saved and shown on the profile (R-DIR-07, R-DIR-08)', async () => {
  const page = interpreterPage
  await page.goto(`${INTERPRETER_URL}/availability`)
  await page.getByLabel('Das').fill('09:00')
  await page.getByLabel('Às').fill('13:00')
  await page.getByRole('button', { name: 'Acrescentar' }).click()
  await expect(page.getByText('09:00–13:00')).toBeVisible()
  await shot(page, '05-availability')

  await page.goto(`${INTERPRETER_URL}/profile/content`)
  await page.getByRole('button', { name: 'Acrescentar vídeo' }).click()
  await page.getByLabel('Título').fill('Saudações em LGA')
  await page.getByLabel('Link').fill('https://www.youtube.com/watch?v=ScMzIvxBSi4')
  await page.getByRole('button', { name: 'Publicar' }).click()
  await expect(page.getByText('Vídeo publicado.')).toBeVisible()
  await shot(page, '06-content')

  await page.goto(`${INTERPRETER_URL}/interpreters/${slug}`)
  await expect(page.getByRole('heading', { name: interpreterName })).toBeVisible()
  await expect(page.getByText('Segunda: 09:00–13:00')).toBeVisible()
  await expect(page.getByText('Ainda sem avaliações')).toBeVisible()
  await shot(page, '07-own-profile-as-others-see')
})

test('the visitor finds the interpreter on the site, logs in and comes back to the profile (criteria 2 and 6)', async ({ browser }) => {
  const requester = await createConfirmedUser('Rui Solicitante')
  acceptTerms(requester.id)
  await apiAs(requester.accessToken, 'POST', '/onboarding/requester', {})
  sqlLocal(`UPDATE identity.interpreter_profiles SET contact_phone = '+244923000111' WHERE account_id = '${interpreter.id}'`)

  const page = await freshPage(browser)
  await page.goto(`${SITE_URL}/interpreters`)
  await page.getByLabel('Pesquisar por nome').fill(stamp)
  const card = page.locator('div.group').filter({ has: page.getByRole('heading', { name: interpreterName }) })
  await expect(card).toBeVisible()
  // The visitor's listing has no contacts (criterion 2).
  await expect(page.getByText('+244923000111')).toHaveCount(0)
  await shot(page, '08-site-directory')

  await card.getByRole('link', { name: /Ver Perfil/ }).click()
  await expect(page).toHaveURL(new RegExp(`${REQUESTER_URL}/login\\?returnTo=`))
  await signIn(page, REQUESTER_URL, requester)
  await expect(page).toHaveURL(`${REQUESTER_URL}/interpreters/${slug}`)
  await expect(page.getByRole('heading', { name: interpreterName })).toBeVisible()
  await expect(page.getByText('+244923000111')).toBeVisible()
  await shot(page, '09-full-profile-after-login')

  await page.getByRole('button', { name: 'Favorito' }).click()
  await expect(page.getByRole('button', { name: 'Nos favoritos' })).toBeVisible()
  await page.goto(`${REQUESTER_URL}/favorites`)
  await expect(page.getByRole('heading', { name: interpreterName })).toBeVisible()
  await shot(page, '10-favorites')
  await page.getByRole('button', { name: 'Remover' }).click()
  await expect(page.getByText('Ainda não tens favoritos.')).toBeVisible()

  await page.goto(`${REQUESTER_URL}/interpreters`)
  await page.getByLabel('Pesquisar por nome').fill('ninguem-com-este-nome')
  await expect(page.getByText('Nenhum intérprete encontrado com estes filtros.')).toBeVisible()
  await shot(page, '11-directory-empty-filters')
})

test('an unknown slug says the interpreter does not exist', async () => {
  await interpreterPage.goto(`${INTERPRETER_URL}/interpreters/nao-existe-${stamp}`)
  await expect(interpreterPage.getByText('Este intérprete não existe ou já não está disponível.')).toBeVisible()
})
