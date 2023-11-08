import type { JestConfigWithTsJest as Config } from 'ts-jest';

const config: Config = {
  verbose: true,
  testEnvironment: 'node',
  testMatch: [ "**/(*.)+(test).ts" ],
  rootDir: '../',
  collectCoverage: true,
  setupFiles: [ '<rootDir>/config/jest.setup.ts' ],
  transform: {
    '^.+\\.ts?$': [
      'ts-jest',
      { tsconfig: './config/tsconfig.cjs.json' },
    ],
  }
};

export default config;
