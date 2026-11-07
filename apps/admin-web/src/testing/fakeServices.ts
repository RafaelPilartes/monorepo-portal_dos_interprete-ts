import { testAccount } from '@portal-dos-interpretes/auth/testing/fakeServices'

// The shared test doubles (packages/auth/src/testing), with the accounts admin-web tests use.
export { fakeServices, type Rows } from '@portal-dos-interpretes/auth/testing/fakeServices'

export const SUPER_ADMIN = testAccount({ id: 'a1', email: 'sara@example.ao', fullName: 'Sara Um', roles: ['staff'], staffLevel: 'super_admin' })
export const INTERPRETER = testAccount({ id: 'a2', email: 'ines@example.ao', fullName: 'Inês', roles: ['interpreter'] })
