import { describe, expect, it } from 'vitest'
import { renderEmail } from './templates.js'

const appUrls = { site: 'https://portal.ao', requester: 'https://pedir.portal.ao', interpreter: 'https://interpretes.portal.ao', admin: 'https://admin.portal.ao' }

describe('email templates of step H2', () => {
  it('org_invite names the organisation and role and links to the invite in the requester app', () => {
    const email = renderEmail('org_invite', { organization_name: 'Clínica Sol', role: 'admin', invited_by_name: 'Olga', link: '/invite/abc', app: 'requester' }, appUrls)
    expect(email.subject).toBe('Convite para Clínica Sol no Portal dos Intérpretes')
    expect(email.text).toContain('Olga convidou-te')
    expect(email.text).toContain('como administrador')
    expect(email.text).toContain('Abre aqui: https://pedir.portal.ao/invite/abc')
  })

  it('account_suspended carries the reason; terms_updated names the document', () => {
    expect(renderEmail('account_suspended', { reason: 'Fraude' }).text).toContain('Motivo: Fraude')
    expect(renderEmail('terms_updated', { kind: 'privacy' }).text).toContain('nova versão da Política de Privacidade')
    expect(renderEmail('terms_updated', { kind: 'terms' }).text).toContain('nova versão dos Termos e Condições')
  })
})
