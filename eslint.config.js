import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import prettier from 'eslint-config-prettier'

export default tseslint.config(
  { ignores: ['**/dist', '**/node_modules', '**/*.config.js'] },

  // Base JS rules
  js.configs.recommended,

  // TypeScript strict + stylistic
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,

  // React rules
  {
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-expressions': ['error', { allowTaggedTemplates: true }],
    },
  },

  // Must be last — disables all formatting rules that Prettier handles
  prettier,
)
