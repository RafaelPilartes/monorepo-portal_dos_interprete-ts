import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { QueryError } from '@portal-dos-interpretes/features/components/QueryStates'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { Label } from '@portal-dos-interpretes/ui/components/label'
import { PageHeader } from '@portal-dos-interpretes/ui/components/page-header'
import { Skeleton } from '@portal-dos-interpretes/ui/components/skeleton'
import { ArrowLeft } from 'lucide-react'
import { useMyProfile } from '@/viewModels/profile.viewmodel'

export type MyProfile = NonNullable<ReturnType<typeof useMyProfile>['data']>

/** A section of /profile: header, loading skeleton, error with retry, then the section itself. */
export function ProfileShell({ title, description, back = true, children }: {
  title: string
  description: string
  back?: boolean
  children: (profile: MyProfile) => ReactNode
}) {
  const profile = useMyProfile()
  return (
    <div className="space-y-6">
      {back && <Button variant="ghost" size="sm" asChild><Link to="/profile"><ArrowLeft className="h-4 w-4" />Perfil</Link></Button>}
      <PageHeader title={title} description={description} />
      {profile.isPending ? (
        <div role="status" aria-label="A carregar o perfil" className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : profile.isError ? (
        <QueryError error={profile.error} onRetry={() => void profile.refetch()} />
      ) : (
        children(profile.data)
      )}
    </div>
  )
}

export function Field({ id, label, hint, error, children }: { id: string; label: string; hint?: ReactNode; error?: string | undefined; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}

/** "" → null, "12 000" → 12000; anything else is left for the database to refuse. */
export function numberOrNull(value: string): number | null {
  const clean = value.replace(/\s/g, '')
  return clean === '' ? null : Number(clean)
}
