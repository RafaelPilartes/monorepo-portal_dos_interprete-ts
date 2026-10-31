import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useDirectory } from '@portal-dos-interpretes/features/directory/DirectoryContext'
import { FileRefused, type DirectoryRepository } from '@portal-dos-interpretes/features/directory/data'
import { errorDetails, errorMessage } from '@portal-dos-interpretes/features/lib/errorText'
import { errorFor } from '@portal-dos-interpretes/core/errors'
import { toast } from 'sonner'

// The interpreter's own profile (interpreter-profile-and-directory.md, /profile and sub-routes):
// one read of everything the screens edit, and the writes straight to the database (column
// grants, RLS). What is missing comes from directory.my_profile_status (R-DIR-01), never from
// a copy of the rule here.

export const myProfileKey = ['my-profile'] as const

export function useMyProfile() {
  const { repository, accountId } = useDirectory()
  return useQuery({
    queryKey: myProfileKey,
    enabled: accountId !== null,
    queryFn: async () => {
      const id = accountId ?? ''
      const [details, status] = await Promise.all([repository.details({ accountId: id }), repository.myStatus()])
      if (!details) throw new Error('interpreter profile not found for the signed-in account')
      return { details, missing: status?.missing ?? [], complete: status?.is_complete === true, bioMinLength: status?.bio_min_length ?? 0 }
    },
  })
}

/** What the person reads when a write fails: the field errors, or one message. */
export function failureOf(error: unknown): { message: string; fields: Record<string, string> } {
  if (error instanceof FileRefused) return { message: errorFor('FILE_INVALID', { reason: error.message }).message, fields: {} }
  return { message: errorMessage(error), fields: errorDetails(error) }
}

/**
 * A write on the own profile; re-reads the profile after it, says how it went. A refusal on a
 * field the form shows stays on that field; anything else is a toast, so nothing fails unseen.
 */
export function useProfileWrite<Input>(
  write: (repository: DirectoryRepository, accountId: string, input: Input) => Promise<unknown>,
  success = 'Alterações guardadas.',
  shownFields: readonly string[] = [],
) {
  const { repository, accountId } = useDirectory()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: Input) => write(repository, accountId ?? '', input),
    onSuccess: () => toast.success(success),
    onError: (error) => {
      const failure = failureOf(error)
      if (!Object.keys(failure.fields).some((field) => shownFields.includes(field))) {
        toast.error(Object.values(failure.fields)[0] ?? failure.message)
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: myProfileKey })
      void queryClient.invalidateQueries({ queryKey: ['directory'] })
    },
  })
}
