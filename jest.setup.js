import '@testing-library/jest-dom'

// Mock environment variables
process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN = 'pk.test.mock_token'

// Mock fetch globally
global.fetch = jest.fn()

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

// Mock Date.now for consistent testing
const mockDateNow = jest.fn(() => 1234567890000)
Date.now = mockDateNow

// Mock Math.random for consistent testing
const mockMathRandom = jest.fn(() => 0.5)
Math.random = mockMathRandom

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks()
  mockDateNow.mockReturnValue(1234567890000)
  mockMathRandom.mockReturnValue(0.5)
})