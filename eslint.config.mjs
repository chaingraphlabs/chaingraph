/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

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
    ignores: [
      '**/fixtures',
      '**/*.generated.*',
      'packages/badai-api/src/gql/client/**/*',
      'packages/badai-api/schema.graphql',
      '**/*.md',
      '**/ecosystem.config.js',
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.nuxt/**',
      '**/.output/**',
      '**/.vercel/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/.git/**',
      '**/.hg/**',
      '**/.svn/**',
      '**/.DS_Store',
      '**/Thumbs.db',
      '**/*.min.*',
      '**/CHANGELOG',
      '**/LICENSE*',
      '**/README*',
      '**/*.config.js',
      '**/*.config.cjs',
      '**/*.config.mjs',
      '**/vite.config.*',
      '**/webpack.config.*',
      '**/rollup.config.*',
      '**/gulpfile.*',
      '**/Gruntfile.*',
      '**/jest.config.*',
      '**/babel.config.*',
      '**/tsconfig*.json',
      '**/pnpm-lock.yaml',
      '**/package-lock.json',
      '**/yarn.lock',
      '**/.conductor/**/*',
    ],
  },
  // Add custom rules
  {
    rules: {
      'ts/explicit-function-return-type': 'off',
      'style/brace-style': ['error', '1tbs', { allowSingleLine: true }],
      'unused-imports/no-unused-vars': 'off',
      'no-unused-variable': 'off',
      'no-unused-vars': 'off',
      // '@typescript-eslint/no-unused-vars': ['error', { varsIgnorePattern: '^_', argsIgnorePattern: '^_' }],
      'ts/no-unsafe-function-type': 'off',
      'no-console': 'off',

      // imports
      'import/order': 'off',
      'import/first': 'off',
      'import/no-duplicates': 'off',
      'sort-imports': 'off',
      'simple-import-sort/imports': 'off',
      'antfu/imports-order': 'off', // Specifically for @antfu/eslint-config
      'style/eol-last': 'off'
    },
  },
)
