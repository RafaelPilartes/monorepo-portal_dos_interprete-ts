import { formatDate } from '@portal-dos-interpretes/i18n'
import { ProfileShell } from '@/components/profile/ProfileShell'
import { RowsEditor } from '@/components/profile/RowsEditor'

// /profile/experience: education, experience and certifications, kept in the database.
export default function InterpreterProfileExperience() {
  return (
    <ProfileShell title="Percurso" description="A tua formação, experiência e certificações.">
      {({ details }) => (
        <div className="space-y-6">
          <RowsEditor
            table="experiences"
            title="Experiência"
            description="Onde trabalhaste como intérprete."
            empty="Ainda não acrescentaste experiência."
            addLabel="Acrescentar experiência"
            rows={details.experiences}
            fields={[
              { key: 'role', label: 'Função' },
              { key: 'organization', label: 'Organização' },
              { key: 'start_date', label: 'Início', kind: 'date' },
              { key: 'end_date', label: 'Fim', kind: 'date', hint: 'Deixa vazio se ainda trabalhas lá.' },
              { key: 'is_current', label: 'Trabalho aqui actualmente', kind: 'checkbox' },
              { key: 'description', label: 'Descrição', kind: 'textarea' },
            ]}
            summary={(row) => (
              <>
                <p className="font-medium">{row.role} · {row.organization}</p>
                <p className="text-muted-foreground">{formatDate(row.start_date)} – {row.is_current ? 'actual' : row.end_date ? formatDate(row.end_date) : ''}</p>
              </>
            )}
          />
          <RowsEditor
            table="education"
            title="Formação"
            description="Cursos e graus."
            empty="Ainda não acrescentaste formação."
            addLabel="Acrescentar formação"
            rows={details.education}
            fields={[
              { key: 'degree', label: 'Grau ou curso' },
              { key: 'field', label: 'Área' },
              { key: 'institution', label: 'Instituição' },
              { key: 'start_year', label: 'Ano de início', kind: 'number' },
              { key: 'end_year', label: 'Ano de fim', kind: 'number' },
              { key: 'is_current', label: 'Ainda a frequentar', kind: 'checkbox' },
              { key: 'certificate_url', label: 'Link do certificado', kind: 'url', hint: 'Começa por https://' },
            ]}
            summary={(row) => (
              <>
                <p className="font-medium">{row.degree}{row.field ? ` em ${row.field}` : ''}</p>
                <p className="text-muted-foreground">{row.institution}{row.start_year ? ` · ${row.start_year}–${row.is_current ? 'actual' : row.end_year ?? ''}` : ''}</p>
              </>
            )}
          />
          <RowsEditor
            table="certifications"
            title="Certificações"
            description="Certificados e acreditações."
            empty="Ainda não acrescentaste certificações."
            addLabel="Acrescentar certificação"
            rows={details.certifications}
            fields={[
              { key: 'name', label: 'Nome' },
              { key: 'issuer', label: 'Entidade' },
              { key: 'issued_on', label: 'Data de emissão', kind: 'date' },
              { key: 'expires_on', label: 'Validade', kind: 'date' },
              { key: 'credential_url', label: 'Link da credencial', kind: 'url', hint: 'Começa por https://' },
            ]}
            summary={(row) => (
              <>
                <p className="font-medium">{row.name}</p>
                <p className="text-muted-foreground">{row.issuer}{row.issued_on ? ` · ${formatDate(row.issued_on)}` : ''}</p>
              </>
            )}
          />
        </div>
      )}
    </ProfileShell>
  )
}
