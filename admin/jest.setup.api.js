/**
 * Jest Setup for API Tests
 * 专门用于API测试的设置文件
 */

// 加载环境变量
require('./env.config.js').initEnv();

// Mock fetch for API tests
global.fetch = jest.fn();

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Setup test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.GITHUB_TOKEN = 'test-github-token';
process.env.GITHUB_OWNER = 'test-owner';
process.env.GITHUB_REPO = 'test-repo';
process.env.GITHUB_BRANCH = 'test-branch';

// Mock Next.js request/response objects
global.mockRequest = (overrides = {}) => ({
  method: 'GET',
  url: 'http://localhost:3001/api/test',
  headers: new Map(),
  json: jest.fn().mockResolvedValue({}),
  ...overrides,
});

global.mockResponse = (overrides = {}) => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
  send: jest.fn().mockReturnThis(),
  end: jest.fn().mockReturnThis(),
  setHeader: jest.fn().mockReturnThis(),
  ...overrides,
});

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
});
