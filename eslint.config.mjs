// eslint.config.mjs
import antfu from '@antfu/eslint-config'

export default antfu(
  {
    // Existing configuration
    type: 'lib',
    stylistic: {
      indent: 2,
      quotes: 'single',
    },
    typescript: true,
    jsx: true,
    react: true,
    gitignore: true,
    toml: true,
    jsonc: true,
    formatters: {
      css: true,
      html: true,
      markdown: 'prettier',
      graphql: 'prettier',
    },
    ignores: ['**/fixtures', '**/*.generated.*'],
  },
  // Add custom rules
  {
    rules: {
      'ts/explicit-function-return-type': 'off',
      'style/brace-style': ['error', '1tbs', { allowSingleLine: true }],
      'unused-imports/no-unused-vars': 'off',
    },
  },
)
