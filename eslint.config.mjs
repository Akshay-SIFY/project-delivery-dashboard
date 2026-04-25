export default [
  {
    ignores: ['.next/**', 'node_modules/**', 'out/**', 'dist/**', 'coverage/**', '**/*.ts', '**/*.tsx'],
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {},
  },
]
