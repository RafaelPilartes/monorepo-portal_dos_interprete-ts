import { useState } from 'react'
import { Link } from 'react-router-dom'
import { appUrl } from '@portal-dos-interpretes/ui/lib/app-urls'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { Input } from '@portal-dos-interpretes/ui/components/input'
import { Label } from '@portal-dos-interpretes/ui/components/label'
import { RadioGroup, RadioGroupItem } from '@portal-dos-interpretes/ui/components/radio-group'
import {
  HandHeart,
  Mail,
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  Building2
} from 'lucide-react'
import { toast } from 'sonner'
import logo from '@portal-dos-interpretes/ui/assets/logo.png'

export default function Register() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [userType, setUserType] = useState('requester')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate registration - will be replaced with actual auth
    await new Promise(resolve => setTimeout(resolve, 1500))

    toast.info('O sistema de autenticação será implementado em breve.')
    setIsLoading(false)
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
              Criar Conta
            </h1>
            <p className="text-muted-foreground">
              Registe-se para começar a utilizar o portal
            </p>
          </div>

          {/* User Type Selection */}
          <div className="mb-6">
            <Label className="mb-3 block">Tipo de Conta</Label>
            <RadioGroup
              value={userType}
              onValueChange={setUserType}
              className="grid grid-cols-2 gap-4"
            >
              <div className="relative">
                <RadioGroupItem
                  value="requester"
                  id="requester"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="requester"
                  className="flex flex-col items-center justify-center rounded-xl border-2 border-muted bg-card p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all"
                >
                  <Building2 className="h-6 w-6 mb-2" />
                  <span className="font-medium">Solicitante</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    Preciso de intérprete
                  </span>
                </Label>
              </div>
              <div className="relative">
                <RadioGroupItem
                  value="interpreter"
                  id="interpreter"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="interpreter"
                  className="flex flex-col items-center justify-center rounded-xl border-2 border-muted bg-card p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-secondary peer-data-[state=checked]:bg-secondary/5 cursor-pointer transition-all"
                >
                  <HandHeart className="h-6 w-6 mb-2" />
                  <span className="font-medium">Intérprete</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    Sou intérprete LGA
                  </span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="O seu nome"
                  className="pl-10"
                  required
                />
              </div>
            </div>

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

            <div className="space-y-2">
              <Label htmlFor="password">Palavra-passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  className="pl-10 pr-10"
                  required
                  minLength={8}
                />
                <button
                  type="button"
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

            <div className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                id="terms"
                className="mt-1 rounded border-input"
                required
              />
              <Label
                htmlFor="terms"
                className="font-normal text-muted-foreground"
              >
                Aceito os{' '}
                <a href="#" className="text-primary hover:underline">
                  termos de uso
                </a>{' '}
                e a{' '}
                <a href="#" className="text-primary hover:underline">
                  política de privacidade
                </a>
              </Label>
            </div>

            <Button
              type="submit"
              className={`w-full ${
                userType === 'interpreter'
                  ? 'bg-secondary hover:bg-secondary/90'
                  : ''
              }`}
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                'A criar conta...'
              ) : (
                <>
                  Criar Conta
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Login Link */}
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Já tem uma conta?{' '}
            <Link
              to="/login"
              className="font-medium text-primary hover:underline"
            >
              Entre aqui
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Image/Pattern */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-secondary to-secondary/80 items-center justify-center p-12">
        <div className="max-w-md text-secondary-foreground">
          <h2 className="text-3xl font-bold mb-6">Faça Parte da Mudança</h2>
          <p className="text-lg opacity-90 mb-8">
            Ao criar uma conta, você contribui para uma sociedade mais inclusiva
            e acessível para a comunidade surda angolana.
          </p>
          <div className="space-y-4">
            {[
              'Processo 100% gratuito',
              'Validação pela plataforma',
              'Suporte contínuo'
            ].map(item => (
              <div key={item} className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full bg-secondary-foreground/20 flex items-center justify-center">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
