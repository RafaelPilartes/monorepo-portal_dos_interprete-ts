import { useState } from 'react'
import { useDirectoryCatalog } from '@portal-dos-interpretes/features/directory/DirectoryContext'
import { LANGUAGE_LEVELS, PRICING_SUFFIX } from '@portal-dos-interpretes/features/directory/labels'
import { QueryError } from '@portal-dos-interpretes/features/components/QueryStates'
import { formatAoa } from '@portal-dos-interpretes/i18n'
import { Badge } from '@portal-dos-interpretes/ui/components/badge'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@portal-dos-interpretes/ui/components/card'
import { Input } from '@portal-dos-interpretes/ui/components/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@portal-dos-interpretes/ui/components/select'
import { Skeleton } from '@portal-dos-interpretes/ui/components/skeleton'
import { Switch } from '@portal-dos-interpretes/ui/components/switch'
import { Trash2 } from 'lucide-react'
import { Field, numberOrNull, ProfileShell, type MyProfile } from '@/components/profile/ProfileShell'
import { failureOf, useProfileWrite } from '@/viewModels/profile.viewmodel'

// /profile/services: languages with level, specialties, the catalog services with the
// interpreter's price; the pricing mode is the service's ("por hora" or "fixo").

type Catalog = NonNullable<ReturnType<typeof useDirectoryCatalog>['data']>

function Languages({ profile, catalog }: { profile: MyProfile; catalog: Catalog }) {
  const [languageId, setLanguageId] = useState('')
  const [level, setLevel] = useState('fluent')
  const add = useProfileWrite((repository, accountId, input: { languageId: string; level: string }) =>
    repository.insertOwn('interpreter_languages', { interpreter_id: accountId, language_id: input.languageId, level: input.level }), 'Língua acrescentada.')
  const change = useProfileWrite((repository, accountId, input: { languageId: string; level: string }) =>
    repository.updateLanguageLevel(accountId, input.languageId, input.level))
  const remove = useProfileWrite((repository, accountId, id: string) => repository.deleteLink('interpreter_languages', accountId, id), 'Língua removida.')
  const mine = profile.links.languages
  const names = new Map(catalog.languages.map((row) => [row.id, row]))
  const available = catalog.languages.filter((row) => row.active && !mine.some((link) => link.language_id === row.id))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Línguas</CardTitle>
        <CardDescription>Pelo menos uma, para apareceres no directório.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {mine.length === 0 ? <p className="text-sm text-muted-foreground">Ainda não acrescentaste línguas.</p> : (
          <ul className="divide-y">
            {mine.map((link) => {
              const language = names.get(link.language_id)
              return (
                <li key={link.language_id} className="flex flex-wrap items-center gap-3 py-2">
                  <span className="flex-1 font-medium">{language?.name ?? 'Língua'}{language && !language.active && <Badge variant="outline" className="ml-2">desactivada no catálogo</Badge>}</span>
                  <Select value={link.level} onValueChange={(value) => change.mutate({ languageId: link.language_id, level: value })}>
                    <SelectTrigger className="w-40" aria-label={`Nível de ${language?.name ?? 'língua'}`}><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(LANGUAGE_LEVELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" aria-label={`Remover ${language?.name ?? 'língua'}`} disabled={remove.isPending} onClick={() => remove.mutate(link.language_id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              )
            })}
          </ul>
        )}
        {available.length > 0 && (
          <div className="flex flex-wrap items-end gap-3">
            <Field id="new-language" label="Língua">
              <Select value={languageId} onValueChange={setLanguageId}>
                <SelectTrigger id="new-language" className="w-56"><SelectValue placeholder="Escolhe uma língua" /></SelectTrigger>
                <SelectContent>{available.map((row) => <SelectItem key={row.id} value={row.id}>{row.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field id="new-language-level" label="Nível">
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger id="new-language-level" className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(LANGUAGE_LEVELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Button
              variant="outline"
              disabled={!languageId || add.isPending}
              onClick={() => add.mutate({ languageId, level }, { onSuccess: () => setLanguageId('') })}
            >
              Acrescentar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function Specialties({ profile, catalog }: { profile: MyProfile; catalog: Catalog }) {
  const toggle = useProfileWrite((repository, accountId, input: { id: string; on: boolean }) => input.on
    ? repository.insertOwn('interpreter_specialties', { interpreter_id: accountId, specialty_id: input.id })
    : repository.deleteLink('interpreter_specialties', accountId, input.id))
  const mine = new Set(profile.links.specialties.map((row) => row.specialty_id))
  return (
    <Card>
      <CardHeader>
        <CardTitle>Especialidades</CardTitle>
        <CardDescription>As áreas em que trabalhas.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {catalog.specialties.filter((row) => row.active || mine.has(row.id)).map((row) => {
          const on = mine.has(row.id)
          return (
            <Button key={row.id} type="button" size="sm" variant={on ? 'default' : 'outline'} aria-pressed={on} disabled={toggle.isPending}
              onClick={() => toggle.mutate({ id: row.id, on: !on })}>
              {row.name}
            </Button>
          )
        })}
      </CardContent>
    </Card>
  )
}

function ServiceRow({ link, title, mode }: { link: MyProfile['links']['services'][number]; title: string; mode: string }) {
  const [price, setPrice] = useState(String(link.price_aoa))
  const update = useProfileWrite((repository, _accountId, values: Record<string, unknown>) => repository.updateOwn('interpreter_services', link.id, values))
  const remove = useProfileWrite((repository, _accountId, id: string) => repository.deleteOwn('interpreter_services', id), 'Serviço removido.')
  const errors = update.isError ? failureOf(update.error).fields : {}
  const changed = price.trim() !== String(link.price_aoa)
  return (
    <li className="flex flex-wrap items-end gap-3 py-3">
      <div className="min-w-40 flex-1">
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{formatAoa(Number(link.price_aoa))} {PRICING_SUFFIX[mode]}</p>
      </div>
      <Field id={`price-${link.id}`} label={`Preço (Kz ${PRICING_SUFFIX[mode]})`} error={errors.price_aoa}>
        <Input id={`price-${link.id}`} type="number" min={1} inputMode="numeric" className="w-36" value={price} onChange={(e) => setPrice(e.target.value)} />
      </Field>
      {changed && <Button size="sm" disabled={update.isPending} onClick={() => update.mutate({ price_aoa: numberOrNull(price) })}>Guardar preço</Button>}
      <div className="flex items-center gap-2 pb-2">
        <Switch id={`active-${link.id}`} checked={link.active} aria-label={`${title} activo`} onCheckedChange={(value) => update.mutate({ active: value })} />
        <span className="text-sm">{link.active ? 'Activo' : 'Inactivo'}</span>
      </div>
      <Button variant="ghost" size="icon" aria-label={`Remover ${title}`} disabled={remove.isPending} onClick={() => remove.mutate(link.id)}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </li>
  )
}

function Services({ profile, catalog }: { profile: MyProfile; catalog: Catalog }) {
  const [serviceId, setServiceId] = useState('')
  const [price, setPrice] = useState('')
  const add = useProfileWrite((repository, accountId, input: { serviceId: string; price: number | null }) =>
    repository.insertOwn('interpreter_services', { interpreter_id: accountId, service_id: input.serviceId, price_aoa: input.price }), 'Serviço acrescentado.')
  const errors = add.isError ? failureOf(add.error).fields : {}
  const services = new Map(catalog.services.map((row) => [row.id, row]))
  const mine = profile.links.services
  const available = catalog.services.filter((row) => row.active && !mine.some((link) => link.service_id === row.id))
  const chosen = services.get(serviceId)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Serviços e preços</CardTitle>
        <CardDescription>Pelo menos um serviço activo com preço, para apareceres no directório.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {mine.length === 0 ? <p className="text-sm text-muted-foreground">Ainda não acrescentaste serviços.</p> : (
          <ul className="divide-y">
            {mine.map((link) => {
              const service = services.get(link.service_id)
              return <ServiceRow key={link.id} link={link} title={service?.title ?? 'Serviço'} mode={service?.pricing_mode ?? 'hourly'} />
            })}
          </ul>
        )}
        {available.length > 0 && (
          <div className="flex flex-wrap items-end gap-3">
            <Field id="new-service" label="Serviço">
              <Select value={serviceId} onValueChange={setServiceId}>
                <SelectTrigger id="new-service" className="w-56"><SelectValue placeholder="Escolhe um serviço" /></SelectTrigger>
                <SelectContent>{available.map((row) => <SelectItem key={row.id} value={row.id}>{row.title}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field id="new-service-price" label={`Preço (Kz ${PRICING_SUFFIX[chosen?.pricing_mode ?? 'hourly']})`} error={errors.price_aoa}>
              <Input id="new-service-price" type="number" min={1} inputMode="numeric" className="w-36" value={price} onChange={(e) => setPrice(e.target.value)} />
            </Field>
            <Button
              variant="outline"
              disabled={!serviceId || add.isPending}
              onClick={() => add.mutate({ serviceId, price: numberOrNull(price) }, { onSuccess: () => { setServiceId(''); setPrice('') } })}
            >
              Acrescentar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function InterpreterProfileServices() {
  const catalog = useDirectoryCatalog()
  return (
    <ProfileShell title="Línguas e serviços" description="O que interpretas e quanto cobras.">
      {(profile) => catalog.isPending ? <Skeleton className="h-64 w-full" />
        : catalog.isError ? <QueryError error={catalog.error} onRetry={() => void catalog.refetch()} />
        : (
          <div className="space-y-6">
            <Languages profile={profile} catalog={catalog.data} />
            <Services profile={profile} catalog={catalog.data} />
            <Specialties profile={profile} catalog={catalog.data} />
          </div>
        )}
    </ProfileShell>
  )
}
