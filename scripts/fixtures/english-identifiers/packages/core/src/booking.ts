// Deliberate violations: Portuguese identifiers in every position.
export const precoDoPedido = 100
export interface Requester { nomeCompleto: string }
export const inline = { nome: 'a', total: 2 }
export function save(pedido: number, { morada }: { morada: string }) { return [pedido, morada] }
export class Store { guardarPedido() { return 1 } }
export const avaliação = 5
import { readFile as apagar } from 'node:fs'
export { apagar }
export const run = () => {}
if (run) { const pedidoAberto = 1; void pedidoAberto }
