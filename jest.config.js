module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/server/__tests__/**/*.test.js'],
  transform: {
    '^.+\\.jsx?$': 'babel-jest'
  },
  setupFilesAfterEnv: ['<rootDir>/server/__tests__/setup.js'],
  moduleNameMapper: {
    '\\.(png|jpg|jpeg|gif|svg)$': '<rootDir>/server/__tests__/__mocks__/fileMock.js',
    '^node:crypto$': '<rootDir>/server/__tests__/__mocks__/nodeCrypto.js'
  },
  testTimeout: 30000
}
