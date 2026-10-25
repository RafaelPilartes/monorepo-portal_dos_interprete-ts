import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Mail,
  Phone,
  MapPin,
  MessageCircle,
  Send,
  CheckCircle2
} from 'lucide-react'
import { toast } from 'sonner'
import { PageBanner } from '@/components/PageBanner'

const contactMethods = [
  {
    icon: Mail,
    title: 'Email',
    value: 'info@gracemind.ao',
    description: 'Resposta em até 24 horas úteis'
  },
  {
    icon: Phone,
    title: 'Telefone',
    value: '+244 923 456 789',
    description: 'Segunda a Sexta, 8h-17h'
  },
  {
    icon: MessageCircle,
    title: 'WhatsApp',
    value: '+244 923 456 789',
    description: 'Mensagens e vídeo-chamadas'
  },
  {
    icon: MapPin,
    title: 'Endereço',
    value: 'Luanda, Angola',
    description: 'Atendimento presencial com agendamento'
  }
]

export default function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500))

    setIsSubmitting(false)
    setSubmitted(true)
    toast.success('Mensagem enviada com sucesso!')
  }

  return (
    <div className="flex flex-col">
      {/* Hero Banner */}
      <PageBanner
        title="Entre em Contacto"
        subtitle="Estamos aqui para ajudar. Entre em contacto connosco para esclarecer dúvidas ou saber mais sobre os nossos serviços."
      />

      {/* Contact Section */}
      <section className="section-padding bg-background">
        <div className="container-wide">
          <div className="grid gap-12 lg:grid-cols-2">
            {/* Contact Methods */}
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">
                Formas de Contacto
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {contactMethods.map(method => (
                  <div
                    key={method.title}
                    className="rounded-xl bg-card p-6 shadow-md"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                      <method.icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">
                      {method.title}
                    </h3>
                    <p className="text-foreground font-medium mb-1">
                      {method.value}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {method.description}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-xl bg-accent/50 p-6">
                <h3 className="font-semibold text-foreground mb-2">
                  Horário de Atendimento
                </h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">
                      Segunda a Sexta:
                    </span>{' '}
                    8h00 - 17h00
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Sábado:</span>{' '}
                    9h00 - 13h00
                  </p>
                  <p>
                    <span className="font-medium text-foreground">
                      Domingo:
                    </span>{' '}
                    Encerrado
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="rounded-2xl bg-card p-8 shadow-lg">
              <h2 className="text-2xl font-bold text-foreground mb-6">
                Envie uma Mensagem
              </h2>

              {submitted ? (
                <div className="text-center py-12">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success mb-4">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Mensagem Enviada!
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Recebemos a sua mensagem e entraremos em contacto em breve.
                  </p>
                  <Button variant="outline" onClick={() => setSubmitted(false)}>
                    Enviar outra mensagem
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome Completo</Label>
                      <Input id="name" placeholder="O seu nome" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone (opcional)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+244 900 000 000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Assunto</Label>
                    <Input
                      id="subject"
                      placeholder="Como podemos ajudar?"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Mensagem</Label>
                    <Textarea
                      id="message"
                      placeholder="Escreva a sua mensagem..."
                      rows={5}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      'A enviar...'
                    ) : (
                      <>
                        Enviar Mensagem
                        <Send className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
