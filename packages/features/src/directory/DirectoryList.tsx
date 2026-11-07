import { useEffect, useState } from 'react'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { EmptyState } from '@portal-dos-interpretes/ui/components/empty-state'
import { Input } from '@portal-dos-interpretes/ui/components/input'
import { PaginationBar } from '@portal-dos-interpretes/ui/components/pagination-bar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@portal-dos-interpretes/ui/components/select'
import { Skeleton } from '@portal-dos-interpretes/ui/components/skeleton'
import { Search, Users } from 'lucide-react'
import { InterpreterCard } from '../components/InterpreterCard'
import { QueryError } from '../components/QueryStates'
import { toCard, useDirectory, useDirectoryCatalog, useFavoriteToggle, useListing } from './DirectoryContext'

// /interpreters of site-web and requester-web (interpreter-profile-and-directory.md): search by
// name, filters by language, specialty, modality and city, paginated on the server. The "só
// verificados" filter arrives with the badge (H12).

const PAGE_SIZE = 12
const ALL = 'all'

export function DirectoryList({ profileHref }: { profileHref?: (slug: string) => string }) {
  const { repository } = useDirectory()
  const catalog = useDirectoryCatalog()
  const favorites = useFavoriteToggle()
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [languageId, setLanguageId] = useState(ALL)
  const [specialtyId, setSpecialtyId] = useState(ALL)
  const [modality, setModality] = useState(ALL)
  const [city, setCity] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search), 300)
    return () => clearTimeout(timer)
  }, [search])
  useEffect(() => setPage(1), [debounced, languageId, specialtyId, modality, city])

  const listing = useListing({
    search: debounced || undefined,
    languageId: languageId === ALL ? undefined : languageId,
    specialtyId: specialtyId === ALL ? undefined : specialtyId,
    modality: modality === 'online' || modality === 'in_person' ? modality : undefined,
    city: city || undefined,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  })
  const filtered = debounced !== '' || languageId !== ALL || specialtyId !== ALL || modality !== ALL || city !== ''
  const clear = () => {
    setSearch('')
    setLanguageId(ALL)
    setSpecialtyId(ALL)
    setModality(ALL)
    setCity('')
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input aria-label="Pesquisar por nome" placeholder="Pesquisar por nome" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={languageId} onValueChange={setLanguageId}>
          <SelectTrigger aria-label="Língua"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas as línguas</SelectItem>
            {catalog.data?.languages.filter((row) => row.active).map((row) => <SelectItem key={row.id} value={row.id}>{row.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={specialtyId} onValueChange={setSpecialtyId}>
          <SelectTrigger aria-label="Especialidade"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas as especialidades</SelectItem>
            {catalog.data?.specialties.filter((row) => row.active).map((row) => <SelectItem key={row.id} value={row.id}>{row.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={modality} onValueChange={setModality}>
          <SelectTrigger aria-label="Modalidade"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Presencial e online</SelectItem>
            <SelectItem value="in_person">Presencial</SelectItem>
            <SelectItem value="online">Online</SelectItem>
          </SelectContent>
        </Select>
        <Input aria-label="Cidade" placeholder="Cidade" value={city} onChange={(e) => setCity(e.target.value)} className="lg:col-start-5" />
      </div>

      {listing.isPending ? (
        <div role="status" aria-label="A carregar os intérpretes" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((index) => <Skeleton key={index} className="h-96 rounded-2xl" />)}
        </div>
      ) : listing.isError ? (
        <QueryError error={listing.error} onRetry={() => void listing.refetch()} />
      ) : listing.data.rows.length === 0 ? (
        <EmptyState
          icon={Users}
          title={filtered ? 'Nenhum intérprete encontrado com estes filtros.' : 'Ainda não há intérpretes no directório.'}
          description={filtered ? 'Experimenta outros filtros ou limpa a pesquisa.' : 'Os intérpretes aparecem aqui assim que completam o perfil.'}
          action={filtered ? <Button variant="outline" onClick={clear}>Limpar filtros</Button> : undefined}
        />
      ) : (
        <>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {listing.data.total === 1 ? '1 intérprete' : `${listing.data.total} intérpretes`}
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {listing.data.rows.map((row) => {
              const id = row.account_id ?? ''
              return (
                <InterpreterCard
                  key={id}
                  interpreter={toCard(row, repository)}
                  {...(profileHref ? { profileHref } : {})}
                  favorite={favorites ? {
                    marked: favorites.ids.has(id),
                    pending: favorites.toggle.isPending,
                    onToggle: () => favorites.toggle.mutate({ interpreterId: id, favorite: !favorites.ids.has(id) }),
                  } : undefined}
                />
              )
            })}
          </div>
          <PaginationBar page={page} pageCount={Math.max(1, Math.ceil(listing.data.total / PAGE_SIZE))} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
