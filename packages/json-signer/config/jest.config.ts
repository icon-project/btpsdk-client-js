import type { JestConfigWithTsJest as Config } from 'ts-jest';

const config: Config = {
  verbose: true,
  testEnvironment: 'node',
  testMatch: [ "**/(*.)+(test).ts" ],
  rootDir: '../',
  collectCoverage: true,
  setupFiles: [ '<rootDir>/config/jest.setup.ts' ],
  // moduleFileExtensions: [
  //   "js",
  //   "ts"
  // ],

  transform: {
    '^.+\\.[jt]s?$': [
      'ts-jest',
      { tsconfig: './config/tsconfig.cjs.json' },
    ],
  },
  moduleNameMapper: {
    '(.+)\\.js': '$1'
  },

  // transform: {
  //   '\\.[jt]sx?$': 'ts-jest'
  // },
  // globals: {
  //   'ts-jest': {
  //     useESM: true
  //   }
  // },
  // moduleNameMapper: {
  //   '(.+)\\.js': '$1'
  // },
  // extensionsToTreatAsEsm: ['.ts']

};

export default config;
