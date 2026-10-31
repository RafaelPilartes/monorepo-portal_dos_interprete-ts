import { useState } from 'react'
import { Alert, AlertDescription } from '@portal-dos-interpretes/ui/components/alert'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { Card, CardContent } from '@portal-dos-interpretes/ui/components/card'
import { Input } from '@portal-dos-interpretes/ui/components/input'
import { Eye } from 'lucide-react'
import { Field, ProfileShell, type MyProfile } from '@/components/profile/ProfileShell'
import { failureOf, useProfileWrite } from '@/viewModels/profile.viewmodel'

// /profile/contact: phone, WhatsApp, site and networks, visible to any account (D-51).

const FIELDS = [
  { key: 'contact_phone', label: 'Telefone', hint: 'Com o indicativo, por exemplo +244923000000.', type: 'tel' },
  { key: 'contact_whatsapp', label: 'WhatsApp', hint: 'Com o indicativo, por exemplo +244923000000.', type: 'tel' },
  { key: 'website_url', label: 'Site', hint: 'Começa por https://', type: 'url' },
  { key: 'linkedin_url', label: 'LinkedIn', hint: 'Começa por https://', type: 'url' },
  { key: 'instagram_url', label: 'Instagram', hint: 'Começa por https://', type: 'url' },
  { key: 'facebook_url', label: 'Facebook', hint: 'Começa por https://', type: 'url' },
] as const
type Key = (typeof FIELDS)[number]['key']

function ContactForm({ profile }: { profile: MyProfile }) {
  const row = profile.details.profile
  const [values, setValues] = useState<Record<Key, string>>(() =>
    Object.fromEntries(FIELDS.map(({ key }) => [key, row[key] ?? ''])) as Record<Key, string>)
  const save = useProfileWrite((repository, accountId, input: Record<Key, string>) =>
    repository.updateProfile(accountId, Object.fromEntries(FIELDS.map(({ key }) => [key, input[key].trim() || null]))))
  const errors = save.isError ? failureOf(save.error).fields : {}

  return (
    <form className="space-y-6" onSubmit={(event) => { event.preventDefault(); save.mutate(values) }}>
      <Alert>
        <Eye className="h-4 w-4" />
        <AlertDescription>Visível a qualquer pessoa com conta no Portal.</AlertDescription>
      </Alert>
      <Card>
        <CardContent className="grid gap-5 pt-6 sm:grid-cols-2">
          {FIELDS.map(({ key, label, hint, type }) => (
            <Field key={key} id={key} label={label} hint={hint} error={errors[key]}>
              <Input id={key} type={type} value={values[key]} aria-invalid={!!errors[key]} onChange={(e) => setValues((current) => ({ ...current, [key]: e.target.value }))} />
            </Field>
          ))}
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button type="submit" disabled={save.isPending}>{save.isPending ? 'A guardar…' : 'Guardar'}</Button>
      </div>
    </form>
  )
}

export default function InterpreterProfileContact() {
  return (
    <ProfileShell title="Contactos" description="Como os solicitantes te podem contactar.">
      {(profile) => <ContactForm profile={profile} />}
    </ProfileShell>
  )
}
