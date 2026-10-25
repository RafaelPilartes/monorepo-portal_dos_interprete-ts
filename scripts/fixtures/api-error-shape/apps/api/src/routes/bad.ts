export function handler(reply: { status(n: number): { send(b: unknown): void } }) {
  reply.status(400).send({ error: { code: 'X', message: 'Erro', field: 'email' } })
}
