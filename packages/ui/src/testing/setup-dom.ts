import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Browser APIs that jsdom lacks and the moved screens use (AnimatedSection,
// next-themes, Radix). Test-only; imported from each app's vitest setup.
class IntersectionObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): [] {
    return []
  }
}

class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

const globals = globalThis as unknown as Record<string, unknown>
globals.IntersectionObserver ??= IntersectionObserverStub
globals.ResizeObserver ??= ResizeObserverStub

if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList
}

if (typeof window !== 'undefined' && !window.scrollTo) {
  window.scrollTo = () => {}
}

// Unmount between tests (vitest runs without globals, so RTL cannot do it alone).
afterEach(() => cleanup())
