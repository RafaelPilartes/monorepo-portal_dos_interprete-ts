import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight panel:text-[1.375rem] panel:font-semibold panel:leading-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1 panel:text-sm">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
