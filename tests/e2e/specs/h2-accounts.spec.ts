import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { expect, test, type Browser, type Page } from '@playwright/test'
import { ADMIN_URL, INTERPRETER_URL, latestEmail, REQUESTER_URL, repoRoot } from '../local'

// Step H2 in the browser against the local database and mail server (MASTER-PLAN H2: registo →
// confirmação no email local → onboarding → troca de papel → criar organização → convidar →
// aceitar), plus the team's suspension and a new legal version. The page fixture is the
// super_admin (admin.setup.ts); the other people get their own browser contexts.

test.describe.configure({ mode: 'serial' })

const evidence = path.join(repoRoot, 'docs/plan/evidence/H2')
mkdirSync(evidence, { recursive: true })
async function shot(page: Page, name: string): Promise<void> {
  await page.waitForTimeout(400)
  await page.screenshot({ path: path.join(evidence, `${name}.jpg`), type: 'jpeg', quality: 75 })
}

const stamp = Date.now().toString(36)
const owner = { name: 'Olga Dona', email: `olga-${stamp}@empresa.ao`, password: `Senha${stamp}1` }
const invitee = { name: 'Beto Convidado', email: `beto-${stamp}@empresa.ao`, password: `Senha${stamp}2` }
const nif = `54${Date.now().toString().slice(-8)}`
const orgName = `Clínica Sol ${stamp}`

/** The confirmation link the Auth server emailed (the local mail server keeps it). */
async function confirmationLink(email: string): Promise<string> {
  const message = await latestEmail(email, /confirm/i)
  const link = /https?:\/\/[^\s"'<>]+\/auth\/v1\/verify\?[^\s"'<>]+/.exec(message.text)?.[0]
  if (!link) throw new Error(`no confirmation link for ${email}`)
  return link.replace(/&amp;/g, '&')
}

async function freshPage(browser: Browser): Promise<Page> {
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] }, viewport: { width: 1280, height: 800 } })
  return context.newPage()
}

let ownerPage: Page
let inviteePage: Page

test('a person registers with consent, confirms the email and creates an organisation (R-ACC-01, R-PRIV-01, R-ORG-01)', async ({ browser }) => {
  ownerPage = await freshPage(browser)
  const page = ownerPage
  await page.goto(`${REQUESTER_URL}/register`)
  await expect(page.getByRole('button', { name: 'Criar conta' })).toBeDisabled()
  await page.getByRole('radio', { name: /Represento uma empresa/ }).click()
  await page.getByLabel('Nome completo').fill(owner.name)
  await page.getByLabel('Email', { exact: true }).fill(owner.email)
  await page.getByLabel('Palavra-passe', { exact: true }).fill(owner.password)
  await page.getByRole('button', { name: 'Termos e Condições' }).click()
  // The version in force; an empty text says "Texto em preparação." (PC-05).
  await expect(page.getByRole('dialog')).toContainText(/Termos e Condições · versão \d+/)
  await shot(page, '02-register-legal-text')
  await page.keyboard.press('Escape')
  await shot(page, '01-register-box-unticked')
  await page.getByLabel(/Li e aceito os/).check()
  await page.getByRole('button', { name: 'Criar conta' }).click()
  await expect(page.getByRole('heading', { name: 'Confirma o teu email' })).toBeVisible()
  await expect(page.getByText(`Enviámos um email para ${owner.email}`)).toBeVisible()
  await shot(page, '03-register-sent')

  // Signing in before confirming is refused with the way to resend.
  await page.goto(`${REQUESTER_URL}/login`)
  await page.getByLabel('Email', { exact: true }).fill(owner.email)
  await page.getByLabel('Palavra-passe', { exact: true }).fill(owner.password)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByRole('alert')).toContainText('Ainda não confirmaste o teu email')
  await expect(page.getByRole('button', { name: 'Reenviar email' })).toBeVisible()
  await shot(page, '04-login-unconfirmed')

  await page.goto(await confirmationLink(owner.email))
  // intended_role "organization": the organisation onboarding (R-ACC-01, R-ACC-04).
  await expect(page.getByRole('heading', { name: 'Criar a organização' })).toBeVisible()
  await shot(page, '05-onboarding-organization')
  await page.getByLabel('Nome da organização').fill(orgName)
  await page.getByLabel('NIF').fill('abc')
  await page.getByRole('button', { name: 'Criar a organização' }).click()
  await expect(page.getByText('NIF inválido.')).toBeVisible()
  await shot(page, '06-onboarding-invalid-nif')
  await page.getByLabel('NIF').fill(nif)
  await page.getByLabel(/Cidade/).fill('Luanda')
  await page.getByRole('button', { name: 'Criar a organização' }).click()
  await expect(page.getByRole('heading', { name: orgName })).toBeVisible()
  await expect(page.getByText('O teu papel: Dono.')).toBeVisible()
  await shot(page, '07-organization')
})

test('the owner invites by email; the invite waits in the list (R-ORG-02)', async () => {
  const page = ownerPage
  await page.goto(`${REQUESTER_URL}/organization/members`)
  await expect(page.getByText('Ainda não convidaste ninguém.')).toBeVisible()
  await shot(page, '08-members-empty-invites')
  await page.getByPlaceholder('email@empresa.ao').fill(invitee.email)
  await page.getByRole('button', { name: 'Convidar' }).click()
  await expect(page.getByRole('cell', { name: invitee.email })).toBeVisible()
  await shot(page, '09-members-invited')
})

test('the owner adds the interpreter role and switches app without signing in again (R-ACC-04, criterion 3)', async () => {
  const page = ownerPage
  await page.goto(`${INTERPRETER_URL}/`)
  await expect(page.getByRole('heading', { name: 'Esta área é para intérpretes' })).toBeVisible()
  await shot(page, '10-interpreter-area-without-role')
  await page.getByRole('link', { name: 'Criar o meu perfil de intérprete' }).click()
  await expect(page.getByRole('heading', { name: 'Criar o teu perfil de intérprete' })).toBeVisible()
  await page.getByLabel(/Cidade onde trabalhas/).fill('Luanda')
  await page.getByRole('button', { name: 'Criar o perfil' }).click()
  await expect(page).toHaveURL(`${INTERPRETER_URL}/profile`)
  const toRequester = page.getByRole('button', { name: 'Mudar para solicitante' })
  await expect(toRequester).toBeVisible()
  await shot(page, '11-interpreter-with-switch')
  await toRequester.click()
  await expect(page).toHaveURL(`${REQUESTER_URL}/`)
  await expect(page.getByRole('button', { name: 'Mudar para intérprete' })).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'A pedir como' })).toContainText(orgName)
  await shot(page, '12-requester-with-context')
})

test('the invited person creates the account from the invite and accepts it (R-ORG-02, criterion 1 of personal data)', async ({ browser }) => {
  const message = await latestEmail(invitee.email, /Convite/)
  const link = /http:\/\/localhost:5171\/invite\/[A-Za-z0-9_-]+/.exec(message.text)?.[0]
  expect(link, 'the org_invite email carries the link').toBeTruthy()
  inviteePage = await freshPage(browser)
  const page = inviteePage
  await page.goto(link as string)
  await expect(page.getByRole('heading', { name: `Convite para ${orgName}` })).toBeVisible()
  await expect(page.getByText(/be\*\*\*@empresa\.ao/)).toBeVisible()
  await shot(page, '13-invite-anonymous')
  await page.getByRole('link', { name: 'Criar conta' }).click()
  await page.getByLabel('Nome completo').fill(invitee.name)
  await page.getByLabel('Email', { exact: true }).fill(invitee.email)
  await page.getByLabel('Palavra-passe', { exact: true }).fill(invitee.password)
  await page.getByLabel(/Li e aceito os/).check()
  await page.getByRole('button', { name: 'Criar conta' }).click()
  await expect(page.getByRole('heading', { name: 'Confirma o teu email' })).toBeVisible()
  await page.goto(await confirmationLink(invitee.email))
  // The confirmation comes back to the invite (returnTo), signed in.
  await expect(page.getByRole('button', { name: 'Aceitar o convite' })).toBeVisible()
  await shot(page, '14-invite-signed-in')
  await page.getByRole('button', { name: 'Aceitar o convite' }).click()
  await expect(page.getByRole('heading', { name: orgName })).toBeVisible()
  await expect(page.getByText('O teu papel: Membro.')).toBeVisible()
  await shot(page, '15-invite-accepted')
  await page.goto(`${REQUESTER_URL}/organization/members`)
  await expect(page.getByRole('cell', { name: owner.email })).toBeVisible()
  await shot(page, '16-members-as-member')
})

test('the team lists accounts and organisations and suspends with a reason (R-ACC-05, criterion 6)', async ({ page }) => {
  await page.goto(`${ADMIN_URL}/organizations`)
  await page.getByLabel('Pesquisar por nome ou NIF').fill(stamp)
  await expect(page.getByRole('link', { name: orgName })).toHaveCount(1)
  await shot(page, '17-admin-organizations')
  await page.getByRole('link', { name: orgName }).click()
  await expect(page.getByRole('cell', { name: invitee.email })).toBeVisible()
  await shot(page, '18-admin-organization')

  await page.goto(`${ADMIN_URL}/requesters`)
  await page.getByLabel('Pesquisar por nome ou email').fill(invitee.email)
  // The search reaches the server after a short pause; then only this account is listed.
  await expect(page.getByRole('link', { name: invitee.name })).toHaveCount(1)
  await page.getByRole('link', { name: invitee.name }).click()
  await expect(page.getByText(/Termos e Condições · versão \d+/).first()).toBeVisible()
  await shot(page, '19-admin-account')
  await page.getByRole('button', { name: 'Suspender' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('button', { name: 'Suspender' })).toBeDisabled()
  await dialog.getByLabel('Motivo').fill('Uso indevido da conta da organização')
  await shot(page, '20-admin-suspend-dialog')
  await dialog.getByRole('button', { name: 'Suspender' }).click()
  await expect(page.getByText(/Suspensa desde/)).toBeVisible()
  await shot(page, '21-admin-account-suspended')

  // The suspended person: the next request fails and the app shows "Conta suspensa".
  await inviteePage.goto(`${REQUESTER_URL}/organization`)
  await expect(inviteePage.getByRole('heading', { name: 'A tua conta está suspensa' })).toBeVisible()
  await shot(inviteePage, '22-suspended')

  await page.getByRole('button', { name: 'Reactivar' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Reactivar' }).click()
  await expect(page.getByText(/Suspensa desde/)).toBeHidden()
  await inviteePage.goto(`${REQUESTER_URL}/organization`)
  await expect(inviteePage.getByRole('heading', { name: orgName })).toBeVisible()
})

test('a new version of the terms is required everywhere until accepted (R-PRIV-02, criterion 2)', async ({ page }) => {
  await page.goto(`${ADMIN_URL}/settings/legal`)
  await expect(page.getByText(/Em vigor: versão/).first()).toBeVisible()
  const newVersion = page.getByRole('button', { name: 'Nova versão' })
  if (await newVersion.isVisible()) await newVersion.click()
  await page.getByLabel('Texto do documento').fill('Termos de teste, versão nova.')
  await page.getByRole('button', { name: 'Publicar…' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Confirmar' }).click()
  await expect(page.getByText(/publicada\./).first()).toBeVisible()
  // The team accepts like everyone else: the next screen asks for it.
  await page.goto(`${ADMIN_URL}/team`)
  await expect(page.getByRole('heading', { name: 'Há uma nova versão dos documentos legais' })).toBeVisible()
  await page.getByLabel('Li e aceito estas versões.').check()
  await page.getByRole('button', { name: 'Aceitar e continuar' }).click()
  await expect(page).toHaveURL(`${ADMIN_URL}/team`)

  await inviteePage.goto(`${REQUESTER_URL}/organization`)
  await expect(inviteePage.getByRole('heading', { name: 'Há uma nova versão dos documentos legais' })).toBeVisible()
  await shot(inviteePage, '23-accept-terms')
  await inviteePage.getByLabel('Li e aceito estas versões.').check()
  await inviteePage.getByRole('button', { name: 'Aceitar e continuar' }).click()
  await expect(inviteePage.getByRole('heading', { name: orgName })).toBeVisible()
})
