import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6 panel:mb-7">
      <div>
        <h1 className="text-2xl font-bold tracking-tight panel:text-[1.5rem] panel:font-semibold panel:leading-tight panel:tracking-[-0.02em] [text-wrap:balance]">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1 panel:mt-1.5 panel:max-w-[65ch] panel:text-sm">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
