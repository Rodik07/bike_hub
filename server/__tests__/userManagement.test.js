import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../models/User.model.js';
import * as emailService from '../utils/emailService.js';
import {
  app,
  request,
  encodePassword,
  generateTestUser,
  createUserInDb,
  getAuthToken,
  getAdminToken,
  authHeader
} from './testUtils.js';

describe('Module 1: User Management', () => {
  describe('Registration - POST /api/auth/register', () => {
    it('1. should register a new user with valid details', async () => {
      const user = generateTestUser({ email: 'newuser@bikehub.com' });
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: user.name,
          email: user.email,
          password: encodePassword(user.password),
          phone: user.phone
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.email).toBe('newuser@bikehub.com');
      expect(res.body.role).toBe('user');
    });

    it('2. should fail if email already exists', async () => {
      await createUserInDb({ email: 'exists@bikehub.com', name: 'Existing User' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'New User',
          email: 'exists@bikehub.com',
          password: encodePassword('Password123!')
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('already exists');
    });

    it('3. should fail if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'missing@bikehub.com' });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toEqual(expect.arrayContaining([
        expect.objectContaining({ path: 'name' })
      ]));
    });

    it('4. should fail if password is less than 8 characters', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Short Pass User',
          email: 'short@bikehub.com',
          password: '1234'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: expect.stringContaining('8 characters') })
        ])
      );
    });

    it('5. should hash the password before saving to DB', async () => {
      const plain = 'Password123!';
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Hash Test',
          email: 'hash@bikehub.com',
          password: encodePassword(plain)
        });

      expect(res.statusCode).toBe(201);

      const saved = await User.findById(res.body._id);
      expect(saved.password).not.toBe(plain);
      expect(await bcrypt.compare(plain, saved.password)).toBe(true);
    });
  });

  describe('Login - POST /api/auth/login & verify-otp', () => {
    beforeEach(async () => {
      await createUserInDb({
        email: 'login@bikehub.com',
        name: 'Login User',
        password: 'Password123!'
      });
    });

    it('6. should login successfully with valid credentials (OTP step)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@bikehub.com',
          password: encodePassword('Password123!')
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.otpSent).toBe(true);
      expect(res.body.email).toBe('login@bikehub.com');
      expect(emailService.sendOTPEmail).toHaveBeenCalled();
    });

    it('7. should fail with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@bikehub.com',
          password: encodePassword('WrongPassword!')
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toContain('Invalid password');
    });

    it('8. should fail with unregistered email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'unknown@bikehub.com',
          password: encodePassword('Password123!')
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toContain('Invalid credentials');
    });

    it('9. should return a valid JWT token after OTP verification', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@bikehub.com',
          password: encodePassword('Password123!')
        });

      const user = await User.findOne({ email: 'login@bikehub.com' });
      user.otpCode = '654321';
      user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
      await user.save();

      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ email: 'login@bikehub.com', otp: '654321' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(typeof res.body.token).toBe('string');
      expect(res.body.token.split('.').length).toBe(3);
    });

    it('10. should fail if email or password field is empty', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: '', password: '' });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Profile - GET/PUT /api/auth/me & change-password', () => {
    it('11. should return user profile when authenticated (GET /api/auth/me)', async () => {
      const { token } = await getAuthToken({ email: 'profile@bikehub.com' });

      const res = await request(app)
        .get('/api/auth/me')
        .set(authHeader(token));

      expect(res.statusCode).toBe(200);
      expect(res.body.email).toBe('profile@bikehub.com');
      expect(res.body).toHaveProperty('name');
      expect(res.body).not.toHaveProperty('password');
    });

    it('12. should return 401 if no token provided (GET /api/auth/me)', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.statusCode).toBe(401);
      expect(res.body.message).toContain('Not authorized');
    });

    it('13. should update user credentials via PUT /api/auth/change-password', async () => {
      const { token } = await getAuthToken({
        email: 'update@bikehub.com',
        password: 'OldPassword1!'
      });

      const res = await request(app)
        .put('/api/auth/change-password')
        .set(authHeader(token))
        .send({
          currentPassword: 'OldPassword1!',
          newPassword: 'NewPassword2!'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain('Password changed successfully');

      const user = await User.findOne({ email: 'update@bikehub.com' });
      expect(await user.comparePassword('NewPassword2!')).toBe(true);
    });

    it('14. should treat missing token as logged out (protected route returns 401)', async () => {
      const { token } = await getAuthToken({ email: 'logout@bikehub.com' });

      const authed = await request(app)
        .get('/api/auth/me')
        .set(authHeader(token));
      expect(authed.statusCode).toBe(200);

      const loggedOut = await request(app).get('/api/auth/me');
      expect(loggedOut.statusCode).toBe(401);
    });
  });
});
