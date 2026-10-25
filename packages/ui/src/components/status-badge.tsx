import { COMMON_TEXTS } from "@portal-dos-interpretes/i18n";
import { cn } from "../lib/utils";

type StatusType = 
  | 'pending' 
  | 'approved' 
  | 'rejected' 
  | 'completed' 
  | 'canceled' 
  | 'in_progress'
  | 'confirmed'
  | 'active'
  | 'inactive'
  | 'verified'
  | 'unverified';

interface StatusBadgeProps {
  /** A known status, or any string coming from data (unknown ones get a neutral badge). */
  status: StatusType | (string & {});
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  pending: {
    label: 'Pendente',
    className: 'bg-warning/10 text-warning border-warning/20'
  },
  approved: {
    label: 'Aprovado',
    className: 'bg-success/10 text-success border-success/20'
  },
  rejected: {
    label: 'Rejeitado',
    className: 'bg-destructive/10 text-destructive border-destructive/20'
  },
  completed: {
    label: 'Concluído',
    className: 'bg-success/10 text-success border-success/20'
  },
  canceled: {
    label: 'Cancelado',
    className: 'bg-muted text-muted-foreground border-border'
  },
  in_progress: {
    label: 'Em Andamento',
    className: 'bg-primary/10 text-primary border-primary/20'
  },
  confirmed: {
    label: 'Confirmado',
    className: 'bg-secondary/10 text-secondary border-secondary/20'
  },
  active: {
    label: 'Activo',
    className: 'bg-success/10 text-success border-success/20'
  },
  inactive: {
    label: 'Inactivo',
    className: 'bg-muted text-muted-foreground border-border'
  },
  verified: {
    label: 'Verificado',
    className: 'bg-success/10 text-success border-success/20'
  },
  unverified: {
    label: 'Não Verificado',
    className: 'bg-warning/10 text-warning border-warning/20'
  }
};

const UNKNOWN_STATUS = { label: COMMON_TEXTS.unknownStatus, className: 'bg-muted text-muted-foreground border-border' };

function isKnownStatus(status: string): status is StatusType {
  return Object.prototype.hasOwnProperty.call(statusConfig, status);
}

/**
 * The old badge crashed on a status it did not know (04-gaps.md item 7); an
 * unknown one now shows "Estado desconhecido" and logs a warning (foundation.md §E).
 */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const known = isKnownStatus(status);
  if (!known) {
    console.warn(`StatusBadge: unknown status "${status}"`);
  }
  const config = known ? statusConfig[status] : UNKNOWN_STATUS;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
