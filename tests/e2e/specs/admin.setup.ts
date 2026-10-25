import { expect, test as setup } from '@playwright/test'
import { ADMIN_STATE, ADMIN_URL, adminCredentials, requireLocalSupabase } from '../local'

// Signs the super_admin in once through the real login screen and keeps the session for the
// admin specs (staff-and-config.md, /login).
setup('super_admin signs in to admin-web', async ({ page }) => {
  requireLocalSupabase()
  const { email, password } = adminCredentials()
  await page.goto(`${ADMIN_URL}/login`)
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Palavra-passe', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(`${ADMIN_URL}/`)
  await page.context().storageState({ path: ADMIN_STATE })
})
