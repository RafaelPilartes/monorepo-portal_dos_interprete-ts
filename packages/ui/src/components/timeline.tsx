import { cn } from "../lib/utils";
import { LucideIcon } from "lucide-react";

interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  icon?: LucideIcon;
  iconColor?: string;
}

interface TimelineProps {
  events: TimelineEvent[];
  className?: string;
}

export function Timeline({ events, className }: TimelineProps) {
  return (
    <div className={cn("space-y-0", className)}>
      {events.map((event, index) => {
        const Icon = event.icon;
        const isLast = index === events.length - 1;
        
        return (
          <div key={event.id} className="relative pl-8 pb-6">
            {/* Vertical line */}
            {!isLast && (
              <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-border" />
            )}
            
            {/* Dot/Icon */}
            <div 
              className={cn(
                "absolute left-0 top-0 h-6 w-6 rounded-full flex items-center justify-center",
                event.iconColor || "bg-primary"
              )}
            >
              {Icon ? (
                <Icon className="h-3.5 w-3.5 text-white" />
              ) : (
                <div className="h-2 w-2 rounded-full bg-white" />
              )}
            </div>
            
            {/* Content */}
            <div className="pt-0.5">
              <div className="flex items-center justify-between gap-4 mb-1">
                <h4 className="font-medium text-foreground">{event.title}</h4>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{event.date}</span>
              </div>
              {event.description && (
                <p className="text-sm text-muted-foreground">{event.description}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
