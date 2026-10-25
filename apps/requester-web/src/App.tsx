import { AppFooter } from '@portal-dos-interpretes/ui'

export function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex flex-1 items-center justify-center p-8">
        <h1 className="text-2xl font-semibold">Portal dos Intérpretes — área do solicitante a arrancar</h1>
      </main>
      <AppFooter version={__APP_VERSION__} commit={__APP_COMMIT__} />
    </div>
  )
}
