// Shared flat ESLint config for every app and package of the monorepo.
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

const SUPABASE_MESSAGE = 'Only packages/data/src/dao may use Supabase (architecture.md §2, rule 4).'

// Only packages/data/src/dao may talk to Supabase (architecture.md §2, rule 4).
/** @type {import('eslint').Linter.RulesRecord} */
const supabaseRestriction = {
  'no-restricted-imports': [
    'error',
    {
      paths: [{ name: '@supabase/supabase-js', message: SUPABASE_MESSAGE }],
      patterns: [{ group: ['@supabase/*', '@supabase/*/**'], message: SUPABASE_MESSAGE }],
    },
  ],
  'no-restricted-syntax': [
    'error',
    { selector: "ImportExpression[source.value=/^@supabase\\//]", message: SUPABASE_MESSAGE },
  ],
}

/**
 * @param {string[]} daoFiles
 * @returns {import('typescript-eslint').ConfigArray}
 */
function daoOverrides(daoFiles) {
  if (daoFiles.length === 0) return []
  return tseslint.config({ files: daoFiles, rules: { 'no-restricted-imports': 'off', 'no-restricted-syntax': 'off' } })
}

/** Folder (relative to the package) where Supabase is allowed. */
export const DAO_FILES = ['src/dao/**']

/**
 * @param {{ react?: boolean, node?: boolean, daoFiles?: string[] }} [options]
 *   daoFiles: globs where the Supabase restriction is lifted (only packages/data uses it).
 */
export function createEslintConfig(options = {}) {
  const { react = false, node = false, daoFiles = [] } = options
  return tseslint.config(
    { ignores: ['dist', 'coverage', 'node_modules'] },
    {
      extends: [js.configs.recommended, ...tseslint.configs.recommended],
      files: ['**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs}'],
      languageOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        globals: { ...(react ? globals.browser : {}), ...(node ? globals.node : {}) },
      },
      plugins: react ? { 'react-hooks': reactHooks, 'react-refresh': reactRefresh } : {},
      rules: {
        ...(react ? reactHooks.configs.recommended.rules : {}),
        ...(react ? { 'react-refresh/only-export-components': ['warn', { allowConstantExport: true }] } : {}),
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/no-unused-vars': [
          'error',
          { argsIgnorePattern: '^_', varsIgnorePattern: '^_', destructuredArrayIgnorePattern: '^_' },
        ],
        '@typescript-eslint/ban-ts-comment': ['error', { 'ts-ignore': 'allow-with-description' }],
        ...supabaseRestriction,
      },
    },
    { files: ['**/*.cjs'], languageOptions: { sourceType: 'commonjs' } },
    ...daoOverrides(daoFiles),
  )
}

export default createEslintConfig({ node: true })
