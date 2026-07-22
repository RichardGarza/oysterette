// Test setup file
// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '1d';
// CI provides TEST_DATABASE_URL (Postgres service container); local dev falls back to the local test DB
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  'postgresql://garzamacbookair@localhost:5432/oysterette_test?schema=public';

// Increase timeout for integration tests
jest.setTimeout(10000);
