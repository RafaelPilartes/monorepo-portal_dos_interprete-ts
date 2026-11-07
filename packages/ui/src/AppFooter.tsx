export interface AppFooterProps {
  version: string
  commit: string
}

/** Footer with the running version and commit (architecture.md §9). */
export function AppFooter({ version, commit }: AppFooterProps) {
  return (
    <footer className="border-t px-4 py-3 text-xs text-muted-foreground" data-testid="app-footer">
      Versão v{version} · {commit}
    </footer>
  )
}
