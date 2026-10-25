import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { AdminPermissionLevel } from '@/type/enum'
import { useAdminProfileViewModel } from './admin-profile.viewmodel'
import { useUserViewModel } from './user.viewmodel'
import { TEAM_NOT_CONNECTED_MESSAGE } from './team-preview-data'

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
}

describe('admin profile view model stand-in (AD-014)', () => {
  it('lists the preview team, filtered by permission level', async () => {
    const { result } = renderHook(
      () => useAdminProfileViewModel().getAllAdminProfiles(10, 0, undefined, { permission_level: AdminPermissionLevel.FINANCE }),
      { wrapper },
    )
    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(result.current.data?.data.map((member) => member.user?.name)).toEqual(['Ana Beatriz'])
  })

  it('rejects writes with a Portuguese message instead of pretending to save', async () => {
    const { result } = renderHook(() => useAdminProfileViewModel(), { wrapper })
    await expect(result.current.updateAdminProfile({ id: 'a1', data: { is_active: false } })).rejects.toThrow(
      TEAM_NOT_CONNECTED_MESSAGE,
    )
    await expect(
      result.current.createAdminProfile({ user_id: 'u9', permission_level: AdminPermissionLevel.MODERATOR, is_active: true }),
    ).rejects.toThrow(TEAM_NOT_CONNECTED_MESSAGE)
  })

  it('rejects the user role change too', async () => {
    const { result } = renderHook(() => useUserViewModel(), { wrapper })
    await expect(result.current.updateUser({ id: 'u1', data: {} })).rejects.toThrow(TEAM_NOT_CONNECTED_MESSAGE)
  })
})
