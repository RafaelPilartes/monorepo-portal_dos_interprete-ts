// Deliberate violations: one app importing another, by path, by package and dynamically.
import { shared } from '../../admin-web/src/Shared'
import { App } from '@portal-dos-interpretes/admin-web'
export const lazy = () => import('@portal-dos-interpretes/api/src/server')
export { shared, App }
