import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { InterpreterCard } from '@/components/InterpreterCard'
import { AnimatedSection } from '@/components/AnimatedSection'
import { PageBanner } from '@/components/PageBanner'
import { interpreters } from '@/core/mocks/interpretersMocks'
import {
  Search,
  Filter,
  Users,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ShieldOff
} from 'lucide-react'

const ITEMS_PER_PAGE = 6

export default function Interpreters() {
  const [searchTerm, setSearchTerm] = useState('')
  const [modalityFilter, setModalityFilter] = useState('all')
  const [specialtyFilter, setSpecialtyFilter] = useState('all')
  const [verificationFilter, setVerificationFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

  const filteredInterpreters = useMemo(() => {
    return interpreters.filter(interpreter => {
      const matchesSearch =
        interpreter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        interpreter.specialty.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesModality =
        modalityFilter === 'all' ||
        interpreter.modality === modalityFilter ||
        (modalityFilter === 'presencial' && interpreter.modality === 'ambos') ||
        (modalityFilter === 'online' && interpreter.modality === 'ambos')

      const matchesSpecialty =
        specialtyFilter === 'all' ||
        interpreter.areas?.some(area =>
          area.toLowerCase().includes(specialtyFilter.toLowerCase())
        )

      const matchesVerification =
        verificationFilter === 'all' ||
        (verificationFilter === 'verified' && interpreter.verified) ||
        (verificationFilter === 'unverified' && !interpreter.verified)

      return (
        matchesSearch &&
        matchesModality &&
        matchesSpecialty &&
        matchesVerification
      )
    })
  }, [searchTerm, modalityFilter, specialtyFilter, verificationFilter])

  // Sort interpreters: verified first
  const sortedInterpreters = useMemo(() => {
    return [...filteredInterpreters].sort((a, b) => {
      if (a.verified && !b.verified) return -1
      if (!a.verified && b.verified) return 1
      return 0
    })
  }, [filteredInterpreters])

  // Pagination logic
  const totalPages = Math.ceil(sortedInterpreters.length / ITEMS_PER_PAGE)
  const paginatedInterpreters = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return sortedInterpreters.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [sortedInterpreters, currentPage])

  // Reset to page 1 when filters change
  const handleFilterChange =
    (setter: (value: string) => void) => (value: string) => {
      setter(value)
      setCurrentPage(1)
    }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1)
  }

  return (
    <div className="flex flex-col">
      {/* Hero Banner */}
      <PageBanner
        title="Todos Intérpretes"
        subtitle="Encontre o intérprete ideal para suas necessidades de comunicação. Com credenciação profissional validada ou perfil base."
      />

      {/* Trust Badge */}
      <section className="border-b border-border bg-card">
        <div className="container-wide py-6">
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <CheckCircle className="h-5 w-5 text-primary" />
            <span>
              Pode escolher intérpretes com certificação validada ou perfil
              básico
            </span>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-20 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container-wide py-4">
          <div className="flex flex-col gap-4">
            {/* Search and main filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Pesquisar por nome ou especialidade..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-10"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <Select
                  value={modalityFilter}
                  onValueChange={handleFilterChange(setModalityFilter)}
                >
                  <SelectTrigger className="w-[160px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Modalidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="presencial">Presencial</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={specialtyFilter}
                  onValueChange={handleFilterChange(setSpecialtyFilter)}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Área" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Áreas</SelectItem>
                    <SelectItem value="educação">Educação</SelectItem>
                    <SelectItem value="saúde">Saúde</SelectItem>
                    <SelectItem value="jurídico">Jurídico</SelectItem>
                    <SelectItem value="eventos">Eventos</SelectItem>
                    <SelectItem value="religioso">Religioso</SelectItem>
                    <SelectItem value="tecnologia">Tecnologia</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={verificationFilter}
                  onValueChange={handleFilterChange(setVerificationFilter)}
                >
                  <SelectTrigger className="w-[180px]">
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Verificação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">Todos</div>
                    </SelectItem>
                    <SelectItem value="verified">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-success" />
                        Verificados
                      </div>
                    </SelectItem>
                    <SelectItem value="unverified">
                      <div className="flex items-center gap-2">
                        <ShieldOff className="h-4 w-4 text-muted-foreground" />
                        Não Verificados
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interpreters Grid */}
      <section className="py-12 bg-background">
        <div className="container-wide">
          {sortedInterpreters.length > 0 ? (
            <>
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                  {sortedInterpreters.length} intérprete
                  {sortedInterpreters.length !== 1 ? 's' : ''} encontrado
                  {sortedInterpreters.length !== 1 ? 's' : ''}
                  {sortedInterpreters.filter(i => i.verified).length > 0 && (
                    <span className="ml-2 text-success">
                      ({sortedInterpreters.filter(i => i.verified).length}{' '}
                      verificados)
                    </span>
                  )}
                </p>
                <p className="text-sm text-muted-foreground">
                  Página {currentPage} de {totalPages}
                </p>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {paginatedInterpreters.map((interpreter, index) => (
                  <AnimatedSection
                    key={interpreter.slug}
                    animation="fade-up"
                    delay={index * 100}
                  >
                    <InterpreterCard interpreter={interpreter} />
                  </AnimatedSection>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-12 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setCurrentPage(prev => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      page => (
                        <Button
                          key={page}
                          variant={currentPage === page ? 'default' : 'outline'}
                          size="icon"
                          onClick={() => setCurrentPage(page)}
                          className="w-10"
                        >
                          {page}
                        </Button>
                      )
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setCurrentPage(prev => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Nenhum intérprete encontrado
              </h3>
              <p className="text-muted-foreground mb-6">
                Tente ajustar os filtros ou termos de pesquisa.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('')
                  setModalityFilter('all')
                  setSpecialtyFilter('all')
                  setVerificationFilter('all')
                  setCurrentPage(1)
                }}
              >
                Limpar Filtros
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
