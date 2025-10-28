// Test setup file
// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '1d';
process.env.DATABASE_URL = 'postgresql://garzamacbookair@localhost:5432/oysterette_test?schema=public';

// Increase timeout for integration tests
jest.setTimeout(10000);
