import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockRequestsForInterpreter } from '@portal-dos-interpretes/features/mocks/verificationMocks'
import { VerificationRequestDetailsModal } from './VerificationRequestDetailsModal'

const base = mockRequestsForInterpreter[0]!

describe('VerificationRequestDetailsModal status fallback (AD-017)', () => {
  it.each([
    ['suspended', 'Suspensa'],
    ['active', 'Activa'],
  ] as const)('shows %s in Portuguese with the neutral style instead of crashing', (status, label) => {
    render(<VerificationRequestDetailsModal open onOpenChange={() => {}} request={{ ...base, status }} />)
    const badge = screen.getByText(label)
    expect(badge.className).toContain('bg-muted')
    expect(badge.className).not.toContain('warning')
  })
})
