import { ASSIGNMENT_STATUS_LABELS, COMMON_TEXTS, REQUEST_STATUS_LABELS } from "@portal-dos-interpretes/i18n";
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

// The statuses of requests and assignments (data-model.md §5), labels from packages/i18n.
const tone = {
  waiting: 'bg-warning/10 text-warning border-warning/20',
  good: 'bg-success/10 text-success border-success/20',
  info: 'bg-primary/10 text-primary border-primary/20',
  bad: 'bg-destructive/10 text-destructive border-destructive/20',
  ended: 'bg-muted text-muted-foreground border-border',
};
const BOOKING_TONES: Record<string, string> = {
  awaiting_approval: tone.waiting, quoting: tone.waiting, awaiting_interpreters: tone.waiting, awaiting_payment: tone.waiting,
  payment_review: tone.waiting, invited: tone.waiting, applied: tone.waiting,
  confirmed: tone.good, accepted: tone.good, completed: tone.good,
  delivered: tone.info, disputed: tone.bad, declined: tone.bad,
  cancelled: tone.ended, expired: tone.ended, not_selected: tone.ended, withdrawn: tone.ended,
};

const UNKNOWN_STATUS = { label: COMMON_TEXTS.unknownStatus, className: 'bg-muted text-muted-foreground border-border' };

function isKnownStatus(status: string): status is StatusType {
  return Object.prototype.hasOwnProperty.call(statusConfig, status);
}

/**
 * The old badge crashed on a status it did not know (04-gaps.md item 7); an
 * unknown one now shows "Estado desconhecido" and logs a warning (foundation.md §E).
 */
export function StatusBadge({ status, className, kind }: StatusBadgeProps & {
  /** A request or an assignment status: labels from the booking vocabulary (packages/i18n). */
  kind?: 'request' | 'assignment';
}) {
  const bookingLabel = kind === 'request' ? (REQUEST_STATUS_LABELS as Record<string, string>)[status]
    : kind === 'assignment' ? (ASSIGNMENT_STATUS_LABELS as Record<string, string>)[status] : undefined;
  const known = bookingLabel !== undefined || isKnownStatus(status);
  if (!known) {
    console.warn(`StatusBadge: unknown status "${status}"`);
  }
  const config = bookingLabel !== undefined ? { label: bookingLabel, className: BOOKING_TONES[status] ?? tone.ended }
    : known && isKnownStatus(status) ? statusConfig[status] : UNKNOWN_STATUS;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium border panel:border-transparent panel:px-2",
        config.className,
        className
      )}
    >
      {/* The state's colour as a dot as well, so it does not rest on the fill alone. */}
      <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
      {config.label}
    </span>
  );
}
