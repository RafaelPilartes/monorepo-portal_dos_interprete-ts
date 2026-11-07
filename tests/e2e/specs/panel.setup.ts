import { expect, test as setup } from '@playwright/test'
import { apiAs, createConfirmedUser, INTERPRETER_URL, PANEL_STATE, REQUESTER_URL } from '../local'

// An account with both roles for the requester-web and interpreter-web route specs: it signs in
// on the real screen, accepts the documents in force and goes through the requester onboarding;
// the interpreter role is added through the same API route the onboarding screen calls.
setup('an account with both roles signs in to the panels', async ({ page }) => {
  const user = await createConfirmedUser('Joana Dupla')
  await page.goto(`${REQUESTER_URL}/login`)
  await page.getByLabel('Email', { exact: true }).fill(user.email)
  await page.getByLabel('Palavra-passe', { exact: true }).fill(user.password)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await page.getByLabel('Li e aceito estas versões.').check()
  await page.getByRole('button', { name: 'Aceitar e continuar' }).click()
  await expect(page.getByRole('heading', { name: 'Pedir intérpretes como particular' })).toBeVisible()
  await page.getByRole('button', { name: 'Saltar por agora' }).click()
  await expect(page).toHaveURL(`${REQUESTER_URL}/`)
  await apiAs(user.accessToken, 'POST', '/onboarding/interpreter', {})
  await apiAs(user.accessToken, 'POST', '/me/active-role', { role: 'requester' })
  await page.goto(`${INTERPRETER_URL}/`)
  await expect(page.getByText('Joana Dupla').first()).toBeVisible()
  await page.context().storageState({ path: PANEL_STATE })
})
