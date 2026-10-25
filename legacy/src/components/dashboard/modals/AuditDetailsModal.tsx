import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { CheckCircle2, XCircle, Globe, Monitor, MapPin, Hash, User, Activity, AlertTriangle } from "lucide-react"
import type { AuditLog } from "@/pages/dashboard/admin/AdminAudit"

interface AuditDetailsModalProps {
  log: AuditLog | null
  isOpen: boolean
  onClose: () => void
}

export function AuditDetailsModal({ log, isOpen, onClose }: AuditDetailsModalProps) {
  if (!log) return null

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-900/50'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-900/50'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-900/50'
      default: return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-900/50'
    }
  }

  const DataRow = ({ label, value }: { label: string, value: React.ReactNode }) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1.5 border-b border-border/30 last:border-0 gap-1 sm:gap-4">
      <span className="text-sm text-muted-foreground w-1/3">{label}</span>
      <span className="text-sm font-medium sm:w-2/3 text-left sm:text-right overflow-hidden text-ellipsis whitespace-nowrap" title={typeof value === 'string' ? value : undefined}>{value}</span>
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden bg-background">
        <DialogHeader className="px-6 py-4 border-b bg-card">
          <div className="flex items-center justify-between">
            <div className="space-y-1 text-left">
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                Log Integrado de Auditoria
                {log.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-destructive" />
                )}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground flex items-center gap-2">
                <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-foreground/80">{log.id}</span>
                <span>•</span>
                <span>{new Date(log.created_at).toLocaleString('pt-PT')}</span>
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`capitalize px-2 py-0.5 shadow-sm ${getSeverityStyle(log.severity)}`}>
                {log.severity}
              </Badge>
              <Badge variant="outline" className="font-mono px-2 py-0.5 bg-muted/50">
                {log.action}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[75vh]">
          <div className="p-6 space-y-8">
            
            {/* Resumo da Ação */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Activity className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm tracking-tight text-foreground/90">Ocorrência Principal</h3>
              </div>
              <div className="bg-muted/30 border rounded-lg p-4 text-sm leading-relaxed shadow-sm">
                <span className="font-medium text-foreground">{log.description}</span>
                {!log.success && log.error_message && (
                  <div className="mt-3 flex items-start gap-2 text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-xs uppercase tracking-wide mb-1">Motivo da Falha</p>
                      <p>{log.error_message}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Autor */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <User className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm tracking-tight text-foreground/90">Autor do Evento</h3>
                </div>
                <div className="bg-transparent px-1">
                  <DataRow label="Nome" value={log.admin_name} />
                  <DataRow label="Email" value={log.admin_email} />
                  <DataRow label="Role Responsável" value={<span className="uppercase text-xs tracking-wider">{log.admin_role}</span>} />
                  <DataRow label="Dono (ID)" value={<span className="font-mono text-xs text-muted-foreground">{log.admin_id}</span>} />
                </div>
              </div>

              {/* Contexto Técnico */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Monitor className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm tracking-tight text-foreground/90">Contexto Analítico</h3>
                </div>
                <div className="bg-transparent px-1">
                  <DataRow label="Endereço IP" value={<div className="flex items-center sm:justify-end gap-1.5"><Globe className="h-3 w-3 text-muted-foreground" /> <span>{log.ip_address}</span></div>} />
                  <DataRow label="Localidade" value={<div className="flex items-center sm:justify-end gap-1.5"><MapPin className="h-3 w-3 text-muted-foreground" /> <span>{log.location}</span></div>} />
                  <DataRow label="Sessão" value={<div className="flex items-center sm:justify-end gap-1.5"><Hash className="h-3 w-3 text-muted-foreground" /> <span className="font-mono text-xs">{log.session_id.substring(0, 15)}...</span></div>} />
                  <DataRow label="Agente" value={<span className="text-xs text-muted-foreground">{log.user_agent.split(' ')[0]} {log.user_agent.split(' ')[1] || ''}...</span>} />
                </div>
              </div>
            </div>

            <Separator className="bg-border/50" />

            {/* Target */}
            <div>
              <h3 className="font-semibold text-sm tracking-tight text-foreground/90 mb-3">Entidade Afetada (Target)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="border border-border/60 bg-muted/20 p-3 rounded-lg shadow-sm">
                  <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mb-1">Módulo Interno</p>
                  <p className="text-sm font-medium text-foreground/90">{log.module}</p>
                </div>
                <div className="border border-border/60 bg-muted/20 p-3 rounded-lg shadow-sm">
                  <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mb-1">Tipo de Registo</p>
                  <p className="text-sm font-medium text-foreground/90">{log.target_type}</p>
                </div>
                <div className="border border-border/60 bg-muted/20 p-3 rounded-lg shadow-sm">
                  <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mb-1">Identificação</p>
                  <p className="text-sm font-medium text-foreground/90 truncate" title={log.target_label}>{log.target_label}</p>
                  <p className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate" title={log.target_id}>{log.target_id}</p>
                </div>
              </div>
            </div>

            {/* Alterações (Payloads) */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                <h3 className="font-semibold text-sm tracking-tight text-foreground/90">Dados do Payload (Changes)</h3>
                {log.changed_fields && log.changed_fields.length > 0 && (
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground whitespace-nowrap">Fields:</span>
                    <div className="flex flex-wrap gap-1">
                      {log.changed_fields.map(field => (
                        <Badge key={field} variant="secondary" className="px-1.5 py-0 text-[10px] font-mono leading-tight bg-muted">{field}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-border/60 overflow-hidden flex flex-col shadow-sm">
                  <div className="bg-muted px-4 py-2 border-b border-border/60">
                    <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">Original / Anterior (previous_data)</span>
                  </div>
                  <div className="group relative">
                    <pre className="p-4 text-xs overflow-auto max-h-[250px] font-mono text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 transition-colors">
                      {log.previous_data ? JSON.stringify(log.previous_data, null, 2) : <span className="italic opacity-50 block text-center py-4">Nenhum dado anterior</span>}
                    </pre>
                  </div>
                </div>

                <div className="rounded-lg border border-primary/20 overflow-hidden flex flex-col shadow-sm">
                  <div className="bg-primary/5 dark:bg-primary/10 px-4 py-2 border-b border-primary/20">
                    <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-primary dark:text-primary/90">Registado / Novo (new_data)</span>
                  </div>
                  <div className="group relative">
                    <pre className="p-4 text-xs overflow-auto max-h-[250px] font-mono text-primary/80 dark:text-primary/70 bg-primary/[0.02] dark:bg-primary/[0.05] transition-colors">
                      {log.new_data ? JSON.stringify(log.new_data, null, 2) : <span className="italic opacity-50 block text-center py-4">Nenhum dado novo</span>}
                    </pre>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
