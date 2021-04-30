module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: true,
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/index.ts",
    "!src/types.ts",
  ],
  coverageReporters: [
    'text',
    'text-summary',
  ],
};