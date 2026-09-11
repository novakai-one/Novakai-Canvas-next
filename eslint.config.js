/** ESLint owns configuration failure reporting and rerun recovery. */
import tseslint from 'typescript-eslint';
import sonarjs from 'eslint-plugin-sonarjs';

const privatePaths = ['**/core/**', '**/adapters/**'];
const coreForbidden = [
  '**/contract/api*',
  '**/contract/index*',
  '**/contract/compose*',
  '**/adapters/**',
  '**/apps/**',
  '@novakai/*',
];
const restrict = (group) => [
  'error',
  { patterns: [{ group, message: 'Use the permitted capability contract; see import matrix.' }] },
];

export default tseslint.config(
  { ignores: ['node_modules/**', '**/node_modules/**', 'dist/**'] },
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx,js,cjs,mjs}'],
    plugins: { sonarjs },
    rules: {
      'sonarjs/cognitive-complexity': ['error', 2],
      'no-restricted-imports': restrict(privatePaths),
      '@typescript-eslint/no-non-null-assertion': 'error',
    },
  },
  {
    files: ['capability/*/core/**/*.ts'],
    rules: { 'no-restricted-imports': restrict(coreForbidden) },
  },
  {
    files: ['capability/*/contract/api.ts'],
    rules: { 'no-restricted-imports': restrict(['**/adapters/**']) },
  },
  { files: ['capability/*/contract/compose.ts'], rules: { 'no-restricted-imports': 'off' } },
  { files: ['*.cjs'], rules: { '@typescript-eslint/no-require-imports': 'off' } },
);
