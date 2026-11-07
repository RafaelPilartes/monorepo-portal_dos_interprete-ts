import type { UserConfig } from 'vite'

export function readRootVersion(): string
export function readCommit(): string
export function createViteConfig(options: { port: number; root: string }): UserConfig
