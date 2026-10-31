import { Link, useParams } from 'react-router-dom'
import { formatAoa, formatDate } from '@portal-dos-interpretes/i18n'
import { Badge } from '@portal-dos-interpretes/ui/components/badge'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@portal-dos-interpretes/ui/components/card'
import { Skeleton } from '@portal-dos-interpretes/ui/components/skeleton'
import { ArrowLeft, Clock, Facebook, FileText, Globe, Heart, Instagram, Linkedin, MapPin, MessageCircle, Phone, PlayCircle, UserX } from 'lucide-react'
import { MODALITY_LABELS } from '../components/InterpreterCard'
import { QueryError } from '../components/QueryStates'
import { useFavoriteToggle, useInterpreterDetails } from '../directory/DirectoryContext'
import type { InterpreterDetails } from '../directory/data'
import { hhmm, LANGUAGE_LEVELS, PRICING_SUFFIX, WEEKDAYS } from '../directory/labels'

// /interpreters/:slug in requester-web and interpreter-web (R-DIR-04): everything an active
// account may read, contacts included (D-51). An unknown slug, an incomplete profile or a
// suspended account read as "não existe". "Pedir este intérprete" arrives with the request wizard
// (H5); the rating (R-DIR-05) and the late cancellations (R-DIR-06) with their tables.

export function InterpreterNotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <UserX className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
      <h1 className="text-xl font-semibold">Este intérprete não existe ou já não está disponível.</h1>
      <Button variant="outline" asChild><Link to="/interpreters">Ver o directório</Link></Button>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="space-y-3 text-sm">{children}</CardContent>
    </Card>
  )
}

function Contacts({ profile }: { profile: InterpreterDetails['profile'] }) {
  const links = [
    profile.contact_phone && { icon: Phone, label: profile.contact_phone, href: `tel:${profile.contact_phone}` },
    profile.contact_whatsapp && { icon: MessageCircle, label: `WhatsApp ${profile.contact_whatsapp}`, href: `https://wa.me/${profile.contact_whatsapp.replace(/\D/g, '')}` },
    profile.website_url && { icon: Globe, label: 'Site', href: profile.website_url },
    profile.linkedin_url && { icon: Linkedin, label: 'LinkedIn', href: profile.linkedin_url },
    profile.instagram_url && { icon: Instagram, label: 'Instagram', href: profile.instagram_url },
    profile.facebook_url && { icon: Facebook, label: 'Facebook', href: profile.facebook_url },
  ].filter((item): item is { icon: typeof Phone; label: string; href: string } => Boolean(item))
  if (links.length === 0) return <p className="text-muted-foreground">Sem contactos indicados.</p>
  return (
    <ul className="space-y-2">
      {links.map(({ icon: Icon, label, href }) => (
        <li key={href}>
          <a href={href} target={href.startsWith('https') ? '_blank' : undefined} rel="noreferrer" className="inline-flex items-center gap-2 text-primary hover:underline">
            <Icon className="h-4 w-4" aria-hidden="true" />{label}
          </a>
        </li>
      ))}
    </ul>
  )
}

export function InterpreterProfileView({ details }: { details: InterpreterDetails }) {
  const favorites = useFavoriteToggle()
  const { profile } = details
  const id = profile.account_id
  const marked = favorites?.ids.has(id) ?? false
  const videos = details.videos.filter((row) => row.status === 'published')
  const articles = details.articles.filter((row) => row.status === 'published')

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild><Link to="/interpreters"><ArrowLeft className="h-4 w-4" />Directório</Link></Button>

      <Card>
        <CardContent className="flex flex-col gap-6 pt-6 sm:flex-row sm:items-start">
          {details.avatarUrl ? (
            <img src={details.avatarUrl} alt={details.fullName} className="h-28 w-28 rounded-full object-cover" />
          ) : (
            <div aria-hidden="true" className="flex h-28 w-28 items-center justify-center rounded-full bg-muted text-3xl font-semibold text-muted-foreground">
              {details.fullName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 space-y-2">
            <h1 className="text-2xl font-semibold">{details.fullName}</h1>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {profile.modality && <span>{MODALITY_LABELS[profile.modality]}</span>}
              {profile.city && <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" aria-hidden="true" />{profile.city}</span>}
              {profile.years_experience !== null && <span>{profile.years_experience === 1 ? '1 ano de experiência' : `${profile.years_experience} anos de experiência`}</span>}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {details.languages.map((row) => <Badge key={row.id} variant="secondary">{row.name} · {LANGUAGE_LEVELS[row.level] ?? row.level}</Badge>)}
            </div>
            <p className="text-sm text-muted-foreground">Ainda sem avaliações</p>
          </div>
          {favorites && (
            <Button
              variant={marked ? 'secondary' : 'outline'}
              aria-pressed={marked}
              disabled={favorites.toggle.isPending}
              onClick={() => favorites.toggle.mutate({ interpreterId: id, favorite: !marked })}
            >
              <Heart className={`h-4 w-4 ${marked ? 'fill-destructive text-destructive' : ''}`} />
              {marked ? 'Nos favoritos' : 'Favorito'}
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Section title="Sobre">
            <p className="whitespace-pre-line leading-relaxed">{profile.bio}</p>
            {details.specialties.length > 0 && (
              <div className="flex flex-wrap gap-1.5">{details.specialties.map((row) => <Badge key={row.id} variant="outline">{row.name}</Badge>)}</div>
            )}
          </Section>

          <Section title="Serviços e preços">
            <ul className="divide-y">
              {details.services.map((row) => (
                <li key={row.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2">
                  <div>
                    <p className="font-medium">{row.title}</p>
                    {row.description && <p className="text-muted-foreground">{row.description}</p>}
                  </div>
                  <span className="tabular-nums">{formatAoa(row.priceAoa)} {PRICING_SUFFIX[row.pricingMode]}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-muted-foreground">
              {profile.minimum_hourly_rate_aoa !== null && <span>Tarifa mínima: {formatAoa(Number(profile.minimum_hourly_rate_aoa))} por hora</span>}
              {profile.travel_fee_aoa !== null && <span>Taxa de deslocação: {formatAoa(Number(profile.travel_fee_aoa))}</span>}
              <span>{profile.accepts_negotiation ? 'Aceita negociar o preço' : 'Não negoceia o preço'}</span>
            </div>
          </Section>

          {(details.experiences.length > 0 || details.education.length > 0 || details.certifications.length > 0) && (
            <Section title="Percurso">
              {details.experiences.map((row) => (
                <div key={row.id}>
                  <p className="font-medium">{row.role} · {row.organization}</p>
                  <p className="text-muted-foreground">{formatDate(row.start_date)} – {row.is_current ? 'actual' : row.end_date ? formatDate(row.end_date) : ''}</p>
                  {row.description && <p>{row.description}</p>}
                </div>
              ))}
              {details.education.map((row) => (
                <div key={row.id}>
                  <p className="font-medium">{row.degree}{row.field ? ` em ${row.field}` : ''}</p>
                  <p className="text-muted-foreground">{row.institution}{row.start_year ? ` · ${row.start_year}–${row.is_current ? 'actual' : row.end_year ?? ''}` : ''}</p>
                </div>
              ))}
              {details.certifications.map((row) => (
                <div key={row.id}>
                  <p className="font-medium">{row.name}</p>
                  <p className="text-muted-foreground">{row.issuer}{row.issued_on ? ` · ${formatDate(row.issued_on)}` : ''}</p>
                </div>
              ))}
            </Section>
          )}

          {(videos.length > 0 || articles.length > 0) && (
            <Section title="Conteúdo">
              {videos.length > 0 && (
                <Link to={`/interpreters/${profile.slug}/videos`} className="flex items-center gap-2 text-primary hover:underline">
                  <PlayCircle className="h-4 w-4" aria-hidden="true" />{videos.length === 1 ? '1 vídeo' : `${videos.length} vídeos`}
                </Link>
              )}
              {articles.slice(0, 3).map((row) => (
                <Link key={row.id} to={`/interpreters/${profile.slug}/articles/${row.slug}`} className="flex items-center gap-2 text-primary hover:underline">
                  <FileText className="h-4 w-4" aria-hidden="true" />{row.title}
                </Link>
              ))}
              {articles.length > 3 && <Link to={`/interpreters/${profile.slug}/articles`} className="text-primary hover:underline">Ver os {articles.length} artigos</Link>}
            </Section>
          )}
        </div>

        <div className="space-y-6">
          <Section title="Contactos">
            <Contacts profile={profile} />
          </Section>
          <Section title="Disponibilidade">
            {details.availability.length === 0 ? (
              <p className="text-muted-foreground">Sem horário indicado.</p>
            ) : (
              <ul className="space-y-1">
                {details.availability.map((row) => (
                  <li key={row.id} className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />{WEEKDAYS[row.weekday]}: {hhmm(row.start_time)}–{hhmm(row.end_time)}</li>
                ))}
              </ul>
            )}
            {details.blockedDays.length > 0 && (
              <div className="space-y-1">
                <p className="font-medium">Dias indisponíveis</p>
                <p className="text-muted-foreground">{details.blockedDays.slice(0, 6).map((row) => formatDate(row.day)).join(', ')}{details.blockedDays.length > 6 ? '…' : ''}</p>
              </div>
            )}
            <p className="text-xs text-muted-foreground">A disponibilidade é indicativa: confirma a data no pedido.</p>
          </Section>
        </div>
      </div>
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div role="status" aria-label="A carregar o perfil" className="space-y-6">
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

export default function InterpreterProfile() {
  const { slug = '' } = useParams()
  const details = useInterpreterDetails(slug)
  if (details.isPending) return <ProfileSkeleton />
  if (details.isError) return <QueryError error={details.error} onRetry={() => void details.refetch()} />
  if (!details.data) return <InterpreterNotFound />
  return <InterpreterProfileView details={details.data} />
}
