module.exports = {
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  testEnvironment: 'node',
  testRegex: './src/.*\\.(test|spec)?\\.(ts|ts)$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  roots: ['<rootDir>/src'],
};

// export default {
//   testEnvironment: 'node',
//   preset: 'ts-jest/presets/default-esm',
//   transform: {
//     '^.+\\.m?[tj]s?$': ['ts-jest', { useESM: true }],
//   },
//   moduleNameMapper: {
//     '^(\\.{1,2}/.*)\\.(m)?js$': '$1',
//   },
//   testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(m)?ts$',
//   coverageDirectory: 'coverage',
//   collectCoverageFrom: [
//     'src/**/*.ts',
//     'src/**/*.mts',
//     '!src/**/*.d.ts',
//     '!src/**/*.d.mts',
//   ],
// };
