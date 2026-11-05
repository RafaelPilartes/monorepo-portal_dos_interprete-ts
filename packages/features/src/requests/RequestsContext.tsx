import { createContext, useContext, type ReactNode } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { errorMessage } from '../lib/errorText'
import type { RequestsRepository } from './data'

// The requests for a panel app: the repository (built by the app) and the signed-in account.

interface RequestsContextValue {
  repository: RequestsRepository
  accountId: string
}

const RequestsContext = createContext<RequestsContextValue | null>(null)

export function RequestsProvider({ children, ...value }: RequestsContextValue & { children: ReactNode }) {
  return <RequestsContext.Provider value={value}>{children}</RequestsContext.Provider>
}

export function useRequests(): RequestsContextValue {
  const value = useContext(RequestsContext)
  if (!value) throw new Error('useRequests needs a RequestsProvider')
  return value
}

export const requestKeys = {
  all: ['requests'] as const,
  list: (finished: boolean, mineOnly: boolean, page: number) => ['requests', 'list', finished, mineOnly, page] as const,
  one: (id: string) => ['requests', 'one', id] as const,
  mine: ['requests', 'my-assignments'] as const,
  messages: (threadId: string) => ['requests', 'messages', threadId] as const,
}

export function useRequestList(finished: boolean, organizationId: string | null, mineOnly: boolean, page: number, pageSize: number) {
  const { repository, accountId } = useRequests()
  return useQuery({
    queryKey: [...requestKeys.list(finished, mineOnly, page), organizationId],
    queryFn: () => repository.list({ finished, accountId, organizationId, mineOnly, limit: pageSize, offset: (page - 1) * pageSize }),
    placeholderData: keepPreviousData,
  })
}

/** One request with its interpreters and its timeline; null when it does not exist or is not visible. */
export function useRequestDetail(id: string) {
  const { repository } = useRequests()
  return useQuery({
    queryKey: requestKeys.one(id),
    // While it waits for interpreters the other side may act (accept, answer a proposal).
    refetchInterval: (query) => (query.state.data?.request.status === 'awaiting_interpreters' ? 15_000 : false),
    queryFn: async () => {
      const request = await repository.request(id)
      if (!request) return null
      const [assignments, timeline] = await Promise.all([repository.assignments(id), repository.timeline(id)])
      return { request, assignments, timeline }
    },
  })
}

export function useMyAssignments() {
  const { repository } = useRequests()
  return useQuery({ queryKey: requestKeys.mine, queryFn: () => repository.myAssignments() })
}

/** A write through the API; re-reads the requests after it, says how it went. */
export function useRequestAction<Input>(action: (repository: RequestsRepository, input: Input) => Promise<unknown>, success: string) {
  const { repository } = useRequests()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: Input) => action(repository, input),
    onSuccess: () => toast.success(success),
    onError: (error) => toast.error(errorMessage(error)),
    onSettled: () => queryClient.invalidateQueries({ queryKey: requestKeys.all }),
  })
}
