import { cn } from '@portal-dos-interpretes/ui/lib/utils'
export default function EmptyState({ title }: { title: string }) {
  return <p className={cn('p-4')}>{title}</p>
}
