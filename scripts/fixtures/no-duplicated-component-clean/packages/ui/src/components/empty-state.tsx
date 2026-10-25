import { cn } from '../lib/utils'
export function EmptyState({ title }: { title: string }) {
  return <p className={cn('p-4')}>{title}</p>
}
