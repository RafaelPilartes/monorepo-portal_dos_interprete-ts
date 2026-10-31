// Portuguese is allowed on screen: strings, comments and JSX text (pedido, nome, morada).
export function Page({ name, count }: { name: string; count: number }) {
  const label = 'Nome do intérprete'
  const matcher = /Ver Perfil/i
  const ratio = 4 / 2 / 1
  void matcher
  void ratio
  return (
    <section>
      <h1>Pedido de intérprete</h1>
      <p title="Morada">Olá {name}, o seu pedido foi enviado.</p>
      <span>{label}</span>
      <p>
        Submeta para <span>{name}</span>.
        A nossa equipa irá confirmar a disponibilidade.
      </p>
      <p>
        {count} intérprete
        {count !== 1 ? 's' : ''} encontrado
      </p>
    </section>
  )
}
