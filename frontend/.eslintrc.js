module.exports = {
  extends: [
    'prettier',
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json'],
  },
  rules: {
    'no-console': 'error',
    'unused-imports/no-unused-imports': 'warn',
    'react/no-unescaped-entities': 'off',
  },
  plugins: ['@typescript-eslint', 'unused-imports'],
  root: true,
  ignorePatterns: ['webpack.*', 'stories/**/*'],
}
