// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  { ignores: ['dist/*', 'supabase/functions/*', 'node_modules/*'] },
  {
    // React Compiler is not enabled in this project; these compiler-oriented advisories
    // flag intentional patterns (prop→state sync, PanResponder refs, timers) – keep them visible as warnings.
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
    },
  },
]);
