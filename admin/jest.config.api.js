/**
 * Jest配置 - API测试专用
 * 用于测试API路由和服务器端逻辑
 */

const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  displayName: 'API Tests',
  testEnvironment: 'node', // 使用Node.js环境进行API测试
  testMatch: [
    '<rootDir>/src/__tests__/api/**/*.test.{js,ts}',
    '<rootDir>/src/__tests__/lib/**/*.test.{js,ts}',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.api.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/app/api/**/*.{js,ts}',
    'src/lib/**/*.{js,ts}',
    '!src/**/*.d.ts',
  ],
  coverageDirectory: 'coverage/api',
  coverageReporters: ['text', 'lcov', 'html'],
}

module.exports = createJestConfig(customJestConfig)
