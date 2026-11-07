import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./alert-dialog";
import { AlertTriangle, CheckCircle2, XCircle, Info } from "lucide-react";
import { cn } from "../lib/utils";

type ModalVariant = 'danger' | 'warning' | 'success' | 'info';

interface ConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  variant?: ModalVariant;
  isLoading?: boolean;
}

const variantConfig: Record<ModalVariant, { icon: React.ComponentType<{ className?: string | undefined }>; iconClass: string; buttonClass: string }> = {
  danger: {
    icon: XCircle,
    iconClass: 'text-destructive',
    buttonClass: 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
  },
  warning: {
    icon: AlertTriangle,
    iconClass: 'text-warning',
    buttonClass: 'bg-warning text-warning-foreground hover:bg-warning/90'
  },
  success: {
    icon: CheckCircle2,
    iconClass: 'text-success',
    buttonClass: 'bg-success text-success-foreground hover:bg-success/90'
  },
  info: {
    icon: Info,
    iconClass: 'text-primary',
    buttonClass: 'bg-primary text-primary-foreground hover:bg-primary/90'
  }
};

export function ConfirmationModal({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  onConfirm,
  variant = 'info',
  isLoading = false,
}: ConfirmationModalProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className={cn("h-10 w-10 rounded-full flex items-center justify-center", 
              variant === 'danger' ? 'bg-destructive/10' : 
              variant === 'warning' ? 'bg-warning/10' : 
              variant === 'success' ? 'bg-success/10' : 'bg-primary/10'
            )}>
              <Icon className={cn("h-5 w-5", config.iconClass)} />
            </div>
            <AlertDialogTitle>{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className={config.buttonClass}
          >
            {isLoading ? "A processar..." : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
