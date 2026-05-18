import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'bikehub-test-jwt-secret-key';
process.env.JWT_EXPIRE = '1d';
process.env.FRONTEND_URL = 'http://localhost:3000';

await jest.unstable_mockModule('./utils/emailService.js', () => ({
  sendOTPEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
  sendDealerWelcomeEmail: jest.fn().mockResolvedValue(true),
  sendPasswordChangeReminder: jest.fn().mockResolvedValue(true)
}));

let mongoServer;

beforeAll(async () => {
  const testUri =
    process.env.MONGODB_TEST_URI ||
    process.env.MONGODB_URI ||
    null;

  if (testUri) {
    await mongoose.connect(testUri);
    return;
  }

  try {
    mongoServer = await MongoMemoryServer.create({
      instance: { dbName: 'bikehub_jest' }
    });
    await mongoose.connect(mongoServer.getUri());
  } catch (error) {
    console.warn('MongoMemoryServer unavailable, falling back to localhost test DB.', error.message);
    await mongoose.connect('mongodb://127.0.0.1:27017/bikehub_jest');
  }
}, 300000);

beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
}, 60000);
