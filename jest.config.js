/**
 * Jest configuration file for queue-ticket-service
 * 
 * This configuration sets up the Jest testing environment for both unit and integration tests.
 * It includes settings for code coverage, test matching patterns, and environment setup.
 */

module.exports = {
  // The test environment that will be used for testing
  testEnvironment: 'node',
  
  // The directory where Jest should output its coverage files
  coverageDirectory: './coverage/',
  
  // Indicates whether each individual test should be reported during the run
  verbose: true,
  
  // Automatically clear mock calls, instances, contexts and results before every test
  clearMocks: true,
  
  // Collect coverage information from all files
  collectCoverage: true,
  
  // An array of glob patterns indicating a set of files for which coverage information should be collected
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!src/config/**',
    '!**/node_modules/**'
  ],
  
  // The glob patterns Jest uses to detect test files
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  
  // An array of regexp pattern strings that are matched against all test paths, matched tests are skipped
  testPathIgnorePatterns: [
    '/node_modules/'
  ],
  
  // An array of regexp pattern strings that are matched against all source file paths, matched files will skip transformation
  transformIgnorePatterns: [
    '/node_modules/',
    '\\.pnp\\.[^\\/]+$'
  ],
  
  // A map from regular expressions to paths to transformers
  transform: {},
  
  // The paths to modules that run some code to configure or set up the testing environment before each test
  setupFiles: [],
  
  // A list of paths to modules that run some code to configure or set up the testing framework before each test
  setupFilesAfterEnv: [],
  
  // Indicates whether the coverage information should be restored from the previous run
  coverageReporters: [
    'json',
    'lcov',
    'text',
    'clover',
    'html'
  ],
  
  // The threshold for the coverage results
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // An object that configures minimum threshold enforcement for coverage results
  // If the thresholds aren't met, jest will fail
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    },
    './src/services/': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/repositories/': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Allows you to use a custom runner instead of Jest's default test runner
  runner: 'jest-runner',
  
  // The maximum amount of workers used to run your tests
  maxWorkers: '50%',
  
  // An array of directory names to be searched recursively up from the requiring module's location
  moduleDirectories: [
    'node_modules',
    'src'
  ],
  
  // A map from regular expressions to module names or to arrays of module names that allow to stub out resources
  moduleNameMapper: {},
  
  // An array of regexp pattern strings, matched against all module paths before considered 'visible' to the module loader
  modulePathIgnorePatterns: [],
  
  // Activates notifications for test results
  notify: false,
  
  // An enum that specifies notification mode. Requires { notify: true }
  notifyMode: 'failure-change',
  
  // A preset that is used as a base for Jest's configuration
  preset: null,
  
  // Run tests with specified reporters
  reporters: ['default'],
  
  // Automatically reset mock state before every test
  resetMocks: false,
  
  // Reset the module registry before running each individual test
  resetModules: false,
  
  // A path to a custom resolver
  resolver: null,
  
  // Automatically restore mock state and implementation before every test
  restoreMocks: false,
  
  // A list of paths to directories that Jest should use to search for files in
  roots: [
    '<rootDir>'
  ],
  
  // The root directory that Jest should scan for tests and modules within
  rootDir: './',
  
  // A list of paths to snapshot serializer modules Jest should use for snapshot testing
  snapshotSerializers: [],
  
  // The test environment that will be used for testing
  testEnvironment: 'node',
  
  // Options that will be passed to the testEnvironment
  testEnvironmentOptions: {},
  
  // This option allows the use of a custom results processor
  testResultsProcessor: null,
  
  // This option allows use of a custom test runner
  testRunner: 'jest-circus/runner',
  
  // A map from regular expressions to paths to transformers
  transform: {},
  
  // Indicates whether each individual test should be reported during the run
  verbose: true,
  
  // An array of regexp patterns that are matched against all source file paths before re-running tests in watch mode
  watchPathIgnorePatterns: [],
  
  // Whether to use watchman for file crawling
  watchman: true,
  
  // Global setup for all tests
  globalSetup: null,
  
  // Global teardown for all tests
  globalTeardown: null
};