import type { ReactNode } from 'react'
import { appUrl } from '@portal-dos-interpretes/ui/lib/app-urls'
import logo from '@portal-dos-interpretes/ui/assets/logo.png'

/** The frame of every entry page: the form on the left, the Portal's line on the right (lg+). */
export function AuthShell({ title, subtitle, children, footer }: {
  title: string
  subtitle?: ReactNode
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <a href={appUrl('site')} className="mb-10 inline-flex rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <img src={logo} alt="Portal dos Intérpretes" className="h-11 w-auto" />
          </a>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-8 text-sm text-muted-foreground">{footer}</div>}
        </div>
      </div>
      <aside className="hidden h-screen flex-1 items-end self-start bg-primary p-12 text-primary-foreground lg:sticky lg:top-0 lg:flex">
        <figure className="max-w-md">
          <blockquote className="text-2xl font-medium leading-snug">
            “Comunicação inclusiva é um direito, não um privilégio.”
          </blockquote>
          <figcaption className="mt-4 text-sm text-primary-foreground/80">
            Academia Grace Mind · Língua Gestual Angolana e línguas faladas
          </figcaption>
        </figure>
      </aside>
    </div>
  )
}

/** A form-level message: the catalog's Portuguese text, announced to screen readers. */
export function FormAlert({ tone = 'error', children }: { tone?: 'error' | 'success' | 'info'; children: ReactNode }) {
  const styles = {
    error: 'border-destructive/30 bg-destructive/10 text-destructive',
    success: 'border-success/30 bg-success/10 text-success',
    info: 'border-border bg-muted text-foreground',
  }[tone]
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-md border px-3 py-2.5 text-sm ${styles}`}>
      {children}
    </div>
  )
}

/** The message under a field (VALIDATION_FAILED details or the catalog field of the error). */
export function FieldError({ id, message }: { id: string; message: string | undefined }) {
  if (!message) return null
  return <p id={id} className="text-sm text-destructive">{message}</p>
}
