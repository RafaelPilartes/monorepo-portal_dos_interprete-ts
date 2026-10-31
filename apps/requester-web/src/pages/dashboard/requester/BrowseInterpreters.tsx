import { DirectoryList } from '@portal-dos-interpretes/features/directory/DirectoryList'
import { PageHeader } from '@portal-dos-interpretes/ui/components/page-header'

// /interpreters (interpreter-profile-and-directory.md): the directory with the full profile on open.
export default function BrowseInterpreters() {
  return (
    <>
      <PageHeader title="Intérpretes" description="Encontra um intérprete por nome, língua, especialidade, modalidade ou cidade." />
      <DirectoryList />
    </>
  )
}
