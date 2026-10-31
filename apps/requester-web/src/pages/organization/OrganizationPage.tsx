import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { normalizePhone } from '@portal-dos-interpretes/core'
import { QueryError, TableSkeleton } from '@portal-dos-interpretes/features/components/QueryStates'
import { errorDetails, errorMessage } from '@portal-dos-interpretes/features/lib/errorText'
import { ACCOUNT_STATUS_LABELS, ORG_ROLE_LABELS } from '@portal-dos-interpretes/i18n'
import { Badge } from '@portal-dos-interpretes/ui/components/badge'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@portal-dos-interpretes/ui/components/card'
import { EmptyState } from '@portal-dos-interpretes/ui/components/empty-state'
import { Input } from '@portal-dos-interpretes/ui/components/input'
import { Label } from '@portal-dos-interpretes/ui/components/label'
import { PageHeader } from '@portal-dos-interpretes/ui/components/page-header'
import { Building2, Users } from 'lucide-react'
import { toast } from 'sonner'
import type { OrganizationRow, OrganizationUpdate } from '@/data/repositories'
import { useCurrentOrganization, useOrganization, useOrganizationMutations } from '@/viewModels/organization.viewmodel'

// /organization (accounts-and-organizations.md): the organisation's data, editable by owner and
// admin (R-ORG-05); NIF and state only by the API and the team.

const FIELDS: { key: keyof OrganizationUpdate; label: string; type?: string; placeholder?: string }[] = [
  { key: 'name', label: 'Nome' },
  { key: 'sector', label: 'Sector' },
  { key: 'city', label: 'Cidade' },
  { key: 'phone', label: 'Telefone', type: 'tel', placeholder: '923 000 000' },
  { key: 'address', label: 'Morada' },
  { key: 'website_url', label: 'Site', type: 'url', placeholder: 'https://' },
]

function valuesOf(org: OrganizationRow): Record<keyof OrganizationUpdate, string> {
  return {
    name: org.name, sector: org.sector ?? '', city: org.city ?? '', phone: org.phone ?? '', address: org.address ?? '', website_url: org.website_url ?? '',
  }
}

function OrganizationForm({ org, canEdit }: { org: OrganizationRow; canEdit: boolean }) {
  const { update } = useOrganizationMutations(org.id)
  const [values, setValues] = useState(valuesOf(org))
  useEffect(() => setValues(valuesOf(org)), [org])
  const errors = update.isError ? errorDetails(update.error) : {}
  const changed = (Object.keys(values) as (keyof OrganizationUpdate)[]).some((key) => values[key] !== valuesOf(org)[key])

  const save = (event: FormEvent) => {
    event.preventDefault()
    const phone = values.phone.trim() ? normalizePhone(values.phone) ?? values.phone.trim() : null
    update.mutate(
      {
        name: values.name.trim(),
        sector: values.sector.trim() || null,
        city: values.city.trim() || null,
        phone,
        address: values.address.trim() || null,
        website_url: values.website_url.trim() || null,
      },
      {
        onSuccess: () => toast.success('Dados da organização guardados.'),
        onError: (error) => {
          if (Object.keys(errorDetails(error)).length === 0) toast.error(errorMessage(error))
        },
      },
    )
  }

  if (!canEdit) {
    return (
      <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
        {FIELDS.map(({ key, label }) => (
          <div key={key}>
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="mt-0.5 text-sm">{values[key] || '—'}</dd>
          </div>
        ))}
      </dl>
    )
  }

  return (
    <form onSubmit={save} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        {FIELDS.map(({ key, label, type, placeholder }) => (
          <div key={key} className="space-y-1.5">
            <Label htmlFor={`org-${key}`}>{label}</Label>
            <Input
              id={`org-${key}`}
              type={type ?? 'text'}
              placeholder={placeholder}
              value={values[key]}
              onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))}
              aria-invalid={!!errors[key]}
              required={key === 'name'}
            />
            {errors[key] && <p className="text-sm text-destructive">{errors[key]}</p>}
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" disabled={!changed || update.isPending} onClick={() => setValues(valuesOf(org))}>Repor</Button>
        <Button type="submit" disabled={!changed || update.isPending || values.name.trim().length < 2}>
          {update.isPending ? 'A guardar…' : 'Guardar alterações'}
        </Button>
      </div>
    </form>
  )
}

export default function OrganizationPage() {
  const current = useCurrentOrganization()
  const organization = useOrganization(current?.id ?? '')

  if (!current) {
    return (
      <>
        <PageHeader title="Organização" />
        <Card>
          <EmptyState
            icon={Building2}
            title="Ainda não fazes parte de nenhuma organização."
            description="Cria uma para pedir intérpretes em nome de uma empresa, ou aceita o convite que um responsável te enviar por email."
            action={<Button asChild><Link to="/onboarding/organization">Criar a organização</Link></Button>}
          />
        </Card>
      </>
    )
  }

  const canEdit = current.role === 'owner' || current.role === 'admin'
  return (
    <>
      <PageHeader
        title={current.name}
        description={`O teu papel: ${ORG_ROLE_LABELS[current.role]}.`}
        action={<Button variant="outline" asChild><Link to="/organization/members"><Users className="h-4 w-4" />Membros</Link></Button>}
      />
      {current.status === 'suspended' && (
        <div role="status" className="mb-6 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
          A organização está suspensa pela equipa do Portal: não pode criar pedidos. Os membros continuam a entrar e a ver o histórico.
        </div>
      )}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-base">Dados da organização</CardTitle>
          {organization.data && (
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              NIF {organization.data.nif}
              <Badge variant={organization.data.status === 'active' ? 'default' : 'destructive'}>
                {ACCOUNT_STATUS_LABELS[organization.data.status as keyof typeof ACCOUNT_STATUS_LABELS] ?? organization.data.status}
              </Badge>
            </span>
          )}
        </CardHeader>
        <CardContent>
          {organization.isPending ? (
            <TableSkeleton rows={3} />
          ) : organization.isError ? (
            <QueryError error={organization.error} onRetry={() => void organization.refetch()} />
          ) : organization.data ? (
            <OrganizationForm org={organization.data} canEdit={canEdit} />
          ) : (
            <p className="text-sm text-muted-foreground">Não encontrámos esta organização.</p>
          )}
        </CardContent>
      </Card>
    </>
  )
}
