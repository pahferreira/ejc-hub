import { defineConfig } from 'eslint/config'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import globals from 'globals'
import tsParser from '@typescript-eslint/parser'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

// São Paulo clock maths lives in common/schedule/ (CODING_STANDARDS.md, "Event-clock
// maths"). Reading wall-clock parts outside it is the tell, so the primitive stays internal.
const EVENT_CLOCK_IMPORT_PATTERN = {
  group: ['**/common/schedule/eventZoneParts*'],
  message: 'São Paulo clock maths lives in common/schedule/: add a helper there.',
}

export default defineConfig([
  {
    extends: compat.extends(
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
      'plugin:@typescript-eslint/recommended-requiring-type-checking',
      'prettier'
    ),

    plugins: {
      '@typescript-eslint': typescriptEslint,
    },

    languageOptions: {
      globals: {
        ...globals.node,
      },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      parser: tsParser,
      ecmaVersion: 2020,
      sourceType: 'module',
      parserOptions: {
        project: ['./tsconfig.json'],
      },
    },

    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      'prefer-const': 'error',
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      'no-restricted-imports': ['error', { patterns: [EVENT_CLOCK_IMPORT_PATTERN] }],
    },
  },
  {
    // Ports a class implements are interfaces: the modules' repositories and Observability.
    files: ['src/modules/*/domain/*Repository.ts', 'src/core/observability/domain/*.ts'],
    rules: {
      '@typescript-eslint/consistent-type-definitions': 'off',
    },
  },
  {
    // A feature's core class file holds only the class; standalone functions live in its helpers/.
    files: ['src/features/*/core/[A-Z]*.ts'],
    ignores: ['src/features/*/core/*.spec.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'Program > FunctionDeclaration, Program > ExportNamedDeclaration > FunctionDeclaration, Program > ExportDefaultDeclaration > :matches(FunctionDeclaration, ArrowFunctionExpression, FunctionExpression)',
          message: "Move top-level functions to the feature's helpers/ folder.",
        },
        {
          selector:
            'Program > VariableDeclaration > VariableDeclarator > :matches(ArrowFunctionExpression, FunctionExpression), Program > ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > :matches(ArrowFunctionExpression, FunctionExpression)',
          message: "Move top-level functions to the feature's helpers/ folder.",
        },
      ],
    },
  },
  {
    // Helpers are pure: data in, data out. Rejecting a request or touching the
    // database is a business rule, and business rules live on the core class.
    files: ['src/features/*/helpers/**/*.ts'],
    ignores: ['src/features/*/helpers/**/*.spec.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            EVENT_CLOCK_IMPORT_PATTERN,
            {
              group: [
                '**/shared/AppError*',
                '**/shared/is-unique-violation*',
                '**/core/database/client*',
              ],
              message:
                'Helpers are pure. A rule that rejects a request or touches the database is a method on the core class.',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'TSTypeReference > Identifier[name=/Repository$/], TSTypeReference > TSQualifiedName > Identifier.right[name=/Repository$/]',
          message:
            'Helpers are pure. Work that reads or writes through a repository is a method on the core class.',
        },
        {
          selector: ':function[async=true]',
          message: 'Helpers are pure, so they have nothing to await. Move this to the core class.',
        },
      ],
    },
  },
])
