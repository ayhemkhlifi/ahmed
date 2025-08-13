// jest.config.cjs
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).[tj]s?(x)'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'js', 'json', 'tsx', 'jsx'],
  // Optional: disable color when running so captured logs don't include ANSI sequences
  // (we will also strip colors server-side as a fallback)
  // globals: { 'ts-jest': { diagnostics: false } },
}
