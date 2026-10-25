import { cn } from "@/lib/utils";

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
  status: StatusType;
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

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
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
