export function handler(reply: { status(n: number): { send(b: unknown): void } }, err: Error) {
  reply.status(400).send({ error: { code: 'X', message: 'Erro', field: 'email' } })
  const message = err.message
  reply.status(400).send({ problem: { code: 'X', message } })
  reply.status(400).send({ problem: { ['message']: String(err) } })
  reply.status(400).send({ problem: { 'field': String(err) } })
  reply.status(400).send({ problem: { code: 'X', message: string(err) } })
}
declare function string(e: unknown): string
