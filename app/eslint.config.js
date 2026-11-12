// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from 'eslint-plugin-storybook'

import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-plugin-prettier'
import { globalIgnores } from 'eslint/config'

// São Paulo clock maths lives in common/schedule/ (CODING_STANDARDS.md, "Event-clock
// maths"). Reading wall-clock parts outside it is the tell, so the primitive stays internal.
const EVENT_CLOCK_IMPORT_PATTERN = {
  group: ['**/common/schedule/eventZoneParts*'],
  message: 'São Paulo clock maths lives in common/schedule/: add a helper there.',
}

const PROPS_IN_SIGNATURE_MESSAGE =
  'Read props as `props.name`. Destructure in the signature only to give a prop a default value.'

export default tseslint.config(
  [
    globalIgnores(['dist', 'storybook-static']),
    {
      files: ['**/*.{ts,tsx}'],
      plugins: { prettier },
      extends: [
        js.configs.recommended,
        tseslint.configs.recommended,
        reactHooks.configs['recommended-latest'],
        reactRefresh.configs.vite,
      ],
      languageOptions: {
        ecmaVersion: 2020,
        globals: globals.browser,
      },
      rules: {
        'prettier/prettier': ['error', { printWidth: 100 }],
        'prettier/print-width': 'off',
        'prefer-const': 'error',
        '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
        'no-restricted-syntax': [
          'error',
          {
            selector:
              'FunctionDeclaration[id.name=/^[A-Z]/] > ObjectPattern.params:not(:has(AssignmentPattern))',
            message: PROPS_IN_SIGNATURE_MESSAGE,
          },
          {
            selector:
              'VariableDeclarator[id.name=/^[A-Z]/] > ArrowFunctionExpression > ObjectPattern.params:not(:has(AssignmentPattern))',
            message: PROPS_IN_SIGNATURE_MESSAGE,
          },
        ],
        '@typescript-eslint/no-restricted-imports': [
          'error',
          {
            patterns: [
              EVENT_CLOCK_IMPORT_PATTERN,
              {
                group: ['react-hook-form', '@hookform/*'],
                allowTypeImports: true,
                message:
                  "Form libraries live in the form's `use<Intention>Form.ts` hook (or its `use<Intention>Form/` folder).",
              },
            ],
          },
        ],
      },
    },
    {
      files: ['**/use*Form.ts', '**/use*Form/**'],
      rules: {
        '@typescript-eslint/no-restricted-imports': [
          'error',
          { patterns: [EVENT_CLOCK_IMPORT_PATTERN] },
        ],
      },
    },
  ],
  storybook.configs['flat/recommended']
)
