module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: true,
  collectCoverageFrom: [
    "src/**/*.ts",
    "src/**/*.js",
    "!src/index.ts",
  ],
  coverageReporters: [
    'text',
    'text-summary',
  ],
};