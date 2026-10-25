import { useState } from 'react'
import { Link } from 'react-router-dom'
import { appUrl } from '@portal-dos-interpretes/ui/lib/app-urls'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { Input } from '@portal-dos-interpretes/ui/components/input'
import { Label } from '@portal-dos-interpretes/ui/components/label'
import { HandHeart, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

export default function RecoverPassword() {
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate password recovery - will be replaced with actual auth
    await new Promise(resolve => setTimeout(resolve, 1500))

    setIsLoading(false)
    setSubmitted(true)
    toast.success('Email enviado com sucesso!')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-accent via-background to-background">
      <div className="w-full max-w-md">
        {/* Logo */}
        <a
          href={appUrl('site')}
          className="flex items-center gap-2 mb-8 justify-center"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <HandHeart className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold leading-none text-foreground">
              Portal dos
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              Portal dos Intérpretes
            </span>
          </div>
        </a>

        <div className="bg-card rounded-2xl p-8 shadow-lg">
          {submitted ? (
            <div className="text-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success mb-6">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Email Enviado
              </h1>
              <p className="text-muted-foreground mb-6">
                Verifique a sua caixa de entrada. Enviámos instruções para
                redefinir a sua palavra-passe.
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Não recebeu o email?{' '}
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-primary hover:underline"
                >
                  Reenviar
                </button>
              </p>
              <Button variant="outline" asChild className="w-full">
                <Link to="/login">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar ao login
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  Recuperar Palavra-passe
                </h1>
                <p className="text-muted-foreground">
                  Insira o seu email e enviaremos instruções para redefinir a
                  sua palavra-passe.
                </p>
              </div>

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
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? 'A enviar...' : 'Enviar Instruções'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar ao login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
