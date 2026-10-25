// Shared flat ESLint config for every app and package of the monorepo.
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

// Only packages/data/src/dao may talk to Supabase (architecture.md §2, rule 4).
const supabaseRestriction = {
  'no-restricted-imports': [
    'error',
    {
      paths: [
        {
          name: '@supabase/supabase-js',
          message: 'Only packages/data/src/dao may import the Supabase client (architecture.md §2).',
        },
      ],
    },
  ],
}

/**
 * @param {{ react?: boolean, node?: boolean, allowSupabase?: boolean }} [options]
 */
export function createEslintConfig(options = {}) {
  const { react = false, node = false, allowSupabase = false } = options
  return tseslint.config(
    { ignores: ['dist', 'coverage', 'node_modules'] },
    {
      extends: [js.configs.recommended, ...tseslint.configs.recommended],
      files: ['**/*.{ts,tsx,js,mjs}'],
      languageOptions: {
        ecmaVersion: 2022,
        globals: { ...(react ? globals.browser : {}), ...(node ? globals.node : {}) },
      },
      plugins: react ? { 'react-hooks': reactHooks, 'react-refresh': reactRefresh } : {},
      rules: {
        ...(react ? reactHooks.configs.recommended.rules : {}),
        ...(react ? { 'react-refresh/only-export-components': ['warn', { allowConstantExport: true }] } : {}),
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/ban-ts-comment': ['error', { 'ts-ignore': 'allow-with-description' }],
        ...(allowSupabase ? {} : supabaseRestriction),
      },
    },
  )
}

export default createEslintConfig({ node: true })
