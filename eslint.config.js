'use strict';

const js = require('@eslint/js');
const globals = require('globals');

// Flat config for ESLint >= 9 (replaces the legacy .eslintrc.json).
// Mirrors the previous rule set: eslint:recommended + a few project overrides.
module.exports = [
    {
        ignores: ['node_modules/', 'types/', 'scratch/']
    },
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'commonjs',
            globals: {
                ...globals.node
            }
        },
        rules: {
            'no-console': 'off',
            'no-var': 'error',
            'no-unused-vars': 'warn',
            'prefer-const': 'error',
            'semi': ['error', 'always'],
            'no-prototype-builtins': 'off'
        }
    }
];
