export default function ModulePlaceholder({ title, description }: { title: string, description: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
        <p className="text-muted-foreground mt-2">{description}</p>
      </div>
      <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed border-border p-8 text-center animate-in fade-in duration-500 bg-muted/20">
        <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-4">
            <span className="text-4xl">🚧</span>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Módulo em Desenvolvimento</h2>
          <p className="text-sm text-muted-foreground break-words max-w-sm">
            Esta funcionalidade faz parte do reposicionamento do Portal dos Intérpretes e ficará disponível em breve.
          </p>
        </div>
      </div>
    </div>
  );
}
