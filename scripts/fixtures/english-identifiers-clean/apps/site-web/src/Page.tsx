// Portuguese is allowed on screen: strings, comments and JSX text (pedido, nome, morada).
export function Page({ name }: { name: string }) {
  const label = 'Nome do intérprete'
  return (
    <section>
      <h1>Pedido de intérprete</h1>
      <p title="Morada">Olá {name}, o seu pedido foi enviado.</p>
      <span>{label}</span>
    </section>
  )
}
