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
            'prefer-const': 'off',
            'semi': ['error', 'always'],
            'no-prototype-builtins': 'off',
            // Rules newly added to eslint:recommended in ESLint 10. They were not
            // enforced when this codebase was written; keep them as warnings (like
            // no-unused-vars) so they surface for cleanup without breaking the build.
            'preserve-caught-error': 'warn',
            'no-useless-assignment': 'warn'
        }
    }
];
