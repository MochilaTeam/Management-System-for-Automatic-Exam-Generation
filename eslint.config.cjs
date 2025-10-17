// eslint.config.cjs — ESLint v9 (flat config) para Express + TypeScript + Prettier

const js = require('@eslint/js');
const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const importPlugin = require('eslint-plugin-import');
const promisePlugin = require('eslint-plugin-promise');
const prettierPlugin = require('eslint-plugin-prettier');
const globals = require('globals');                 // 👈 IMPORTANTE

module.exports = [
  // Ignora carpetas generadas y dependencias
  { ignores: ['node_modules/', 'dist/', 'build/', 'coverage/'] },

  // Config base de ESLint para JS
  js.configs.recommended,

  // Config específica para TypeScript en tu carpeta "app"
  {
    files: ['app/**/*.{ts,tsx}'],

    languageOptions: {
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',

      // 👇 AQUÍ van los globals (NO en parserOptions)
      globals: {
        ...globals.node,
        ...globals.es2021,
      },

      // Si algún día activas reglas "type-aware", usarías parserOptions.project
      // parserOptions: {
      //   project: ['./tsconfig.json'],
      //   tsconfigRootDir: __dirname,
      // },
    },

    plugins: {
      '@typescript-eslint': tsPlugin,
      import: importPlugin,
      promise: promisePlugin,
      prettier: prettierPlugin,
    },

    settings: {
      'import/resolver': {
        // Requiere: npm i -D eslint-import-resolver-typescript
        typescript: { project: './tsconfig.json' },
      },
    },

    rules: {
      // --- Reglas TypeScript ---
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // Desactiva la base: usaremos la de TS
      'no-unused-vars': 'off',

      // ✅ Evita el falso positivo con `process`
      'no-undef': 'off',

      // --- Orden de imports ---
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index']],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],

      // --- Promesas ---
      'promise/catch-or-return': 'off',
      'promise/always-return': 'off',

      // --- Prettier ---
      'prettier/prettier': 'error',
    },
  },
];
