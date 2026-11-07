import { randomUUID } from 'node:crypto'

// Test helpers that talk to the local Auth server and Mailpit over HTTP. They live under
// integrations/ because only there may the API call fetch (verify.py, no-direct-data-access).

export interface TestAccount {
  id: string
  email: string
  accessToken: string
}

export async function createConfirmedAccount(apiUrl: string, serviceRoleKey: string, anonKey: string): Promise<TestAccount> {
  const email = `test-${randomUUID()}@example.ao`
  const password = `Senha-${randomUUID()}`
  const admin = { authorization: `Bearer ${serviceRoleKey}`, apikey: serviceRoleKey, 'content-type': 'application/json' }
  const created = await fetch(new URL('/auth/v1/admin/users', apiUrl), {
    method: 'POST', headers: admin, body: JSON.stringify({ email, password, email_confirm: true }),
  })
  if (!created.ok) throw new Error(`create user: ${created.status} ${await created.text()}`)
  const { id } = (await created.json()) as { id: string }
  const session = await fetch(new URL('/auth/v1/token?grant_type=password', apiUrl), {
    method: 'POST', headers: { apikey: anonKey, 'content-type': 'application/json' }, body: JSON.stringify({ email, password }),
  })
  if (!session.ok) throw new Error(`sign in: ${session.status} ${await session.text()}`)
  const { access_token: accessToken } = (await session.json()) as { access_token: string }
  return { id, email, accessToken }
}

export async function deleteAccount(apiUrl: string, serviceRoleKey: string, id: string): Promise<void> {
  const response = await fetch(new URL(`/auth/v1/admin/users/${id}`, apiUrl), {
    method: 'DELETE', headers: { authorization: `Bearer ${serviceRoleKey}`, apikey: serviceRoleKey },
  })
  if (!response.ok) throw new Error(`delete user: ${response.status}`)
}

/** Messages Mailpit received for an address. */
export async function mailpitMessages(mailpitUrl: string, to: string): Promise<{ Subject: string; Snippet: string }[]> {
  const response = await fetch(new URL(`/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`, mailpitUrl))
  if (!response.ok) throw new Error(`mailpit: ${response.status}`)
  return ((await response.json()) as { messages: { Subject: string; Snippet: string }[] }).messages
}

/** PUT a file to a signed upload URL, then GET it back from a signed download URL. */
export async function uploadAndRead(signedUploadUrl: string, body: string, contentType: string): Promise<number> {
  const response = await fetch(signedUploadUrl, { method: 'PUT', headers: { 'content-type': contentType }, body })
  return response.status
}

export async function readSigned(url: string): Promise<{ status: number; text: string }> {
  const response = await fetch(url)
  return { status: response.status, text: await response.text() }
}
