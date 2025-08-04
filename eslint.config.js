import eslintConfigNext from 'eslint-config-next';

/** @type {import('eslint').Linter.FlatConfig} */
export default [
  ...eslintConfigNext(),
  {
    rules: {
      // 追加ルール例
      'prettier/prettier': 'error',
    },
    plugins: {
      prettier: require('eslint-plugin-prettier'),
    },
  },
];
