// Deliberate violation: one app importing another, by package and by path.
import { shared } from '../../admin-web/src/Shared'
import { App } from '@portal-dos-interpretes/admin-web'
export { shared, App }
