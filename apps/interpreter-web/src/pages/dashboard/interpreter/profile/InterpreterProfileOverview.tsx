import { useRef, useState } from 'react'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@portal-dos-interpretes/ui/components/card'
import { Input } from '@portal-dos-interpretes/ui/components/input'
import { Label } from '@portal-dos-interpretes/ui/components/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@portal-dos-interpretes/ui/components/select'
import { Switch } from '@portal-dos-interpretes/ui/components/switch'
import { Textarea } from '@portal-dos-interpretes/ui/components/textarea'
import { Camera } from 'lucide-react'
import { Field, numberOrNull, ProfileShell, type MyProfile } from '@/components/profile/ProfileShell'
import { failureOf, useProfileWrite } from '@/viewModels/profile.viewmodel'

// /profile/overview: photo, biography (with its counter), years of experience, modality, city,
// minimum hourly rate, negotiation, travel fee (D-17). The database checks the values and gives
// the biography's minimum (directory.my_profile_status).

function Photo({ profile }: { profile: MyProfile }) {
  const input = useRef<HTMLInputElement>(null)
  const upload = useProfileWrite((repository, accountId, file: File) => repository.updateAvatar(accountId, file), 'Fotografia actualizada.')
  return (
    <div className="flex items-center gap-4">
      {profile.details.avatarUrl ? (
        <img src={profile.details.avatarUrl} alt="A tua fotografia" className="h-20 w-20 rounded-full object-cover" />
      ) : (
        <div aria-hidden="true" className="flex h-20 w-20 items-center justify-center rounded-full bg-muted text-2xl font-semibold text-muted-foreground">
          {profile.details.fullName.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="space-y-1">
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          aria-label="Escolher fotografia"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) upload.mutate(file)
            event.target.value = ''
          }}
        />
        <Button variant="outline" size="sm" disabled={upload.isPending} onClick={() => input.current?.click()}>
          <Camera className="h-4 w-4" />{upload.isPending ? 'A carregar…' : 'Mudar fotografia'}
        </Button>
        <p className="text-xs text-muted-foreground">JPG, PNG ou WebP, até 2 MB.</p>
      </div>
    </div>
  )
}

function OverviewForm({ profile }: { profile: MyProfile }) {
  const row = profile.details.profile
  const [values, setValues] = useState({
    bio: row.bio ?? '',
    years_experience: row.years_experience?.toString() ?? '',
    modality: row.modality ?? '',
    city: row.city ?? '',
    minimum_hourly_rate_aoa: row.minimum_hourly_rate_aoa?.toString() ?? '',
    accepts_negotiation: row.accepts_negotiation,
    travel_fee_aoa: row.travel_fee_aoa?.toString() ?? '',
  })
  const save = useProfileWrite((repository, accountId, input: typeof values) => repository.updateProfile(accountId, {
    bio: input.bio.trim() || null,
    years_experience: numberOrNull(input.years_experience),
    modality: input.modality || null,
    city: input.city.trim() || null,
    minimum_hourly_rate_aoa: numberOrNull(input.minimum_hourly_rate_aoa),
    accepts_negotiation: input.accepts_negotiation,
    travel_fee_aoa: numberOrNull(input.travel_fee_aoa),
  }), 'Alterações guardadas.', ['bio', 'years_experience', 'modality', 'city', 'minimum_hourly_rate_aoa', 'travel_fee_aoa'])
  const errors = save.isError ? failureOf(save.error).fields : {}
  const set = <K extends keyof typeof values>(key: K, value: (typeof values)[K]) => setValues((current) => ({ ...current, [key]: value }))
  const bioLength = values.bio.trim().length
  const bioMin = profile.bioMinLength
  const inPerson = values.modality === 'in_person' || values.modality === 'both'

  return (
    <form className="space-y-6" onSubmit={(event) => { event.preventDefault(); save.mutate(values) }}>
      <Card>
        <CardHeader><CardTitle>Sobre ti</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <Photo profile={profile} />
          <Field
            id="bio"
            label="Biografia"
            error={errors.bio}
            hint={<span className={bioLength < bioMin ? 'text-warning' : undefined}>{bioLength} caracteres{bioLength < bioMin ? ` (mínimo ${bioMin} para apareceres no directório)` : ''}</span>}
          >
            <Textarea id="bio" rows={6} value={values.bio} onChange={(e) => set('bio', e.target.value)} />
          </Field>
          <Field id="years_experience" label="Anos de experiência" error={errors.years_experience}>
            <Input id="years_experience" type="number" min={0} max={70} inputMode="numeric" value={values.years_experience} onChange={(e) => set('years_experience', e.target.value)} className="max-w-32" />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Onde trabalhas</CardTitle></CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <Field id="modality" label="Modalidade" error={errors.modality}>
            <Select value={values.modality} onValueChange={(value) => set('modality', value)}>
              <SelectTrigger id="modality"><SelectValue placeholder="Escolhe" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="in_person">Presencial</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="both">Presencial e online</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field id="city" label="Cidade" error={errors.city} hint={inPerson ? 'Obrigatória para quem trabalha presencialmente.' : undefined}>
            <Input id="city" value={values.city} onChange={(e) => set('city', e.target.value)} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Tarifas</CardTitle></CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <Field id="minimum_hourly_rate_aoa" label="Tarifa mínima por hora (Kz)" error={errors.minimum_hourly_rate_aoa} hint="Indicativa; aparece no teu perfil.">
            <Input id="minimum_hourly_rate_aoa" type="number" min={0} inputMode="numeric" value={values.minimum_hourly_rate_aoa} onChange={(e) => set('minimum_hourly_rate_aoa', e.target.value)} />
          </Field>
          <Field id="travel_fee_aoa" label="Taxa de deslocação (Kz)" error={errors.travel_fee_aoa}>
            <Input id="travel_fee_aoa" type="number" min={0} inputMode="numeric" value={values.travel_fee_aoa} onChange={(e) => set('travel_fee_aoa', e.target.value)} />
          </Field>
          <div className="flex items-center justify-between gap-3 sm:col-span-2">
            <Label htmlFor="accepts_negotiation">Aceito negociar o preço</Label>
            <Switch id="accepts_negotiation" checked={values.accepts_negotiation} onCheckedChange={(value) => set('accepts_negotiation', value)} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={save.isPending}>{save.isPending ? 'A guardar…' : 'Guardar'}</Button>
      </div>
    </form>
  )
}

export default function InterpreterProfileOverview() {
  return (
    <ProfileShell title="Visão geral" description="O essencial do teu perfil.">
      {(profile) => <OverviewForm profile={profile} />}
    </ProfileShell>
  )
}
