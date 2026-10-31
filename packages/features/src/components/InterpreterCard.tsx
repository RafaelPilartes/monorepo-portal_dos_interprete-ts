import { Link } from 'react-router-dom'
import { Badge } from '@portal-dos-interpretes/ui/components/badge'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@portal-dos-interpretes/ui/components/tooltip'
import { ArrowRight, Heart, MapPin, ShieldCheck, Star, Video } from 'lucide-react'
import { interpreterProfilePath } from '../routes'

/** What a card shows: the public listing (directory.public_listing, R-DIR-04). */
export interface InterpreterCardData {
  slug: string
  name: string
  photoUrl: string | null
  city: string | null
  modality: string | null
  languages: readonly string[]
  specialties: readonly string[]
  verified: boolean
  ratingAverage: number | null
  ratingCount: number
}

export const MODALITY_LABELS: Readonly<Record<string, string>> = { online: 'Online', in_person: 'Presencial', both: 'Presencial e online' }

interface InterpreterCardProps {
  interpreter: InterpreterCardData
  compact?: boolean
  /**
   * Where "see profile" leads. Defaults to the in-app profile route; the public
   * site points it at the requester login (D-05, architecture.md §3).
   */
  profileHref?: (slug: string) => string
  /** "Favorito" (R-DIR-10), only where the person can mark favorites. */
  favorite?: { marked: boolean; onToggle: () => void; pending?: boolean } | undefined
}

function Photo({ interpreter, className }: { interpreter: InterpreterCardData; className: string }) {
  return interpreter.photoUrl ? (
    <img src={interpreter.photoUrl} alt={interpreter.name} className={className} />
  ) : (
    <div aria-hidden="true" className={`${className} flex items-center justify-center bg-muted text-4xl font-semibold text-muted-foreground`}>
      {interpreter.name.trim().charAt(0).toUpperCase()}
    </div>
  )
}

function Rating({ interpreter }: { interpreter: InterpreterCardData }) {
  // R-DIR-05: never "0,0"; without reviews the card says so.
  if (interpreter.ratingAverage === null || interpreter.ratingCount === 0) {
    return <span className="text-xs text-muted-foreground">Ainda sem avaliações</span>
  }
  return (
    <span className="flex items-center gap-1 text-sm">
      <Star className="h-4 w-4 fill-warning text-warning" aria-hidden="true" />
      {interpreter.ratingAverage.toFixed(1).replace('.', ',')} ({interpreter.ratingCount})
    </span>
  )
}

export function InterpreterCard({ interpreter, compact = false, profileHref, favorite }: InterpreterCardProps) {
  const href = profileHref ? profileHref(interpreter.slug) : null
  const ModalityIcon = interpreter.modality === 'online' ? Video : MapPin
  const label = compact ? 'Ver Perfil' : 'Ver Perfil Completo'
  const link = href ? (
    <a href={href}>{label}<ArrowRight className="h-4 w-4" /></a>
  ) : (
    <Link to={interpreterProfilePath(interpreter.slug)}>{label}<ArrowRight className="h-4 w-4" /></Link>
  )

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/50 bg-card shadow-md transition-all duration-300 hover:shadow-xl">
      <div className={`relative overflow-hidden ${compact ? 'aspect-[4/5]' : 'aspect-[4/3]'}`}>
        <Photo interpreter={interpreter} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        {interpreter.verified && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="absolute right-3 top-3 flex cursor-help items-center gap-1 rounded-full bg-success px-2.5 py-1 shadow-lg">
                <ShieldCheck className="h-3 w-3 text-success-foreground" />
                <span className="text-xs font-medium text-success-foreground">Verificado</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-[200px]">
              <p className="text-sm">Intérprete com credenciais validadas na Plataforma</p>
            </TooltipContent>
          </Tooltip>
        )}
        {favorite && (
          <button
            type="button"
            onClick={favorite.onToggle}
            disabled={favorite.pending}
            aria-pressed={favorite.marked}
            aria-label={favorite.marked ? `Remover ${interpreter.name} dos favoritos` : `Marcar ${interpreter.name} como favorito`}
            className="absolute left-3 top-3 rounded-full bg-background/90 p-2 shadow transition-colors hover:bg-background"
          >
            <Heart className={`h-4 w-4 ${favorite.marked ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`} />
          </button>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-lg font-semibold text-foreground">{interpreter.name}</h3>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          {interpreter.modality && (
            <span className="flex items-center gap-1"><ModalityIcon className="h-4 w-4" aria-hidden="true" />{MODALITY_LABELS[interpreter.modality] ?? interpreter.modality}</span>
          )}
          {interpreter.city && <span>{interpreter.city}</span>}
        </div>
        {interpreter.languages.length > 0 && <p className="text-sm text-foreground">{interpreter.languages.slice(0, 3).join(', ')}</p>}
        {!compact && interpreter.specialties.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {interpreter.specialties.slice(0, 3).map((name) => <Badge key={name} variant="secondary" className="py-0.5 text-xs">{name}</Badge>)}
          </div>
        )}
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <Rating interpreter={interpreter} />
          <Button size="sm" variant={compact ? 'ghost' : 'default'} asChild>{link}</Button>
        </div>
      </div>
    </div>
  )
}
