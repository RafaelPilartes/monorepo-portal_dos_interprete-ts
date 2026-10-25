import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { errorFor } from '@portal-dos-interpretes/core/errors'
import { DataError } from '@portal-dos-interpretes/data'
import { AUTH_TEXTS } from '@portal-dos-interpretes/i18n'
import { usePortalServices } from '../services/PortalServices'
import { useOptionalSession } from '../session/SessionContext'
import { safeReturnTo } from '../services/returnTo'
import { appUrl } from '@portal-dos-interpretes/ui/lib/app-urls'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { Input } from '@portal-dos-interpretes/ui/components/input'
import { Label } from '@portal-dos-interpretes/ui/components/label'
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner'
import logo from '@portal-dos-interpretes/ui/assets/logo.png'

export interface LoginProps {
  /** Where "Registe-se aqui" leads; the link is hidden when null (admin-web has no registration). */
  registerHref?: string | null
}

export default function Login({ registerHref = '/register' }: LoginProps = {}) {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const services = usePortalServices()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const session = useOptionalSession()

  // Already signed in (or the session just arrived): go where the person was going.
  useEffect(() => {
    if (session?.status === 'authenticated') navigate(safeReturnTo(searchParams.get('returnTo')), { replace: true })
  }, [session?.status, navigate, searchParams])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormError(null)
    if (!services) {
      // Apps whose sign-in arrives in step H2.
      toast.info('O sistema de autenticação será implementado em breve.')
      return
    }
    setIsLoading(true)
    try {
      const result = await services.auth.signIn(email, password)
      if (!result.ok) {
        setFormError(result.reason === 'invalid_credentials' ? AUTH_TEXTS.invalidCredentials : AUTH_TEXTS.emailNotConfirmed)
        return
      }
      // A suspended account is refused here, with the catalog message (R-ACC-03); the redirect
      // happens when the session provider sees the new session (effect above).
      const account = await services.source.load()
      if (!account) setFormError(errorFor('ACCOUNT_SUSPENDED').message)
    } catch (error) {
      console.error('[auth] sign-in failed', error)
      setFormError(error instanceof DataError ? error.message : errorFor('INTERNAL_ERROR').message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <a href={appUrl('site')} className="flex items-center gap-2 mb-4">
            <img src={logo} alt="Portal dos Intérpretes" className="h-14 w-auto" />
          </a>

          {/* Form Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Bem-vindo de volta
            </h1>
            <p className="text-muted-foreground">
              Entre na sua conta para continuar
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  className="pl-10"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Palavra-passe</Label>
                <Link
                  to="/recover-password"
                  className="text-sm text-primary hover:underline"
                >
                  Esqueceu a palavra-passe?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Esconder a palavra-passe' : 'Mostrar a palavra-passe'}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {formError && (
              <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {formError}
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                AUTH_TEXTS.signingIn
              ) : (
                <>
                  Entrar
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Register Link */}
          {registerHref && (
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Não tem uma conta?{' '}
            <Link
              to={registerHref}
              className="font-medium text-primary hover:underline"
            >
              Registe-se aqui
            </Link>
          </p>
          )}
        </div>
      </div>

      {/* Right Side - Image/Pattern */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary to-primary/80 items-center justify-center p-12">
        <div className="max-w-md text-primary-foreground">
          <blockquote className="text-2xl font-medium mb-6">
            "Comunicação inclusiva é um direito, não um privilégio."
          </blockquote>
          <p className="opacity-80">
            Junte-se a centenas de pessoas e organizações que já utilizam o
            Portal dos Intérpretes para garantir acessibilidade.
          </p>
          <div className="mt-8 flex items-center gap-4">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className="h-10 w-10 rounded-full bg-primary-foreground/20 border-2 border-primary flex items-center justify-center text-xs font-medium"
                >
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <span className="text-sm opacity-80">
              +200 utilizadores activos
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
