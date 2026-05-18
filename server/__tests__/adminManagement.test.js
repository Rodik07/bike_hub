import mongoose from 'mongoose';
import User from '../models/User.model.js';
import Dealer from '../models/Dealer.model.js';
import Promotion from '../models/Promotion.model.js';
import Booking from '../models/Booking.model.js';
import * as emailService from '../utils/emailService.js';
import {
  app,
  request,
  encodePassword,
  getAuthToken,
  getAdminToken,
  createUserInDb,
  createAdminInDb,
  createBikeInDb,
  createDealerInDb,
  createPromotionInDb,
  authHeader,
  generateTestDealer,
  generateTestPromotion
} from './testUtils.js';

describe('Module 4: Admin Management', () => {
  describe('Admin authentication', () => {
    it('47. admin should login with valid credentials (OTP flow)', async () => {
      await createAdminInDb({
        email: 'adminlogin@bikehub.com',
        password: 'AdminPass123!'
      });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'adminlogin@bikehub.com',
          password: encodePassword('AdminPass123!')
        });

      expect(loginRes.statusCode).toBe(200);
      expect(loginRes.body.otpSent).toBe(true);

      const admin = await User.findOne({ email: 'adminlogin@bikehub.com' });
      admin.otpCode = '112233';
      admin.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
      await admin.save();

      const verifyRes = await request(app)
        .post('/api/auth/verify-otp')
        .send({ email: 'adminlogin@bikehub.com', otp: '112233' });

      expect(verifyRes.statusCode).toBe(200);
      expect(verifyRes.body.role).toBe('admin');
      expect(verifyRes.body).toHaveProperty('token');
    });

    it('48. should fail admin login with invalid credentials', async () => {
      await createAdminInDb({
        email: 'adminbad@bikehub.com',
        password: 'AdminPass123!'
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'adminbad@bikehub.com',
          password: encodePassword('WrongAdminPass!')
        });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('User administration', () => {
    let adminToken;

    beforeEach(async () => {
      ({ token: adminToken } = await getAdminToken());
    });

    it('49. GET /api/admin/stats should expose total users count for admin', async () => {
      await createUserInDb({ email: 'statsuser1@bikehub.com' });
      await createUserInDb({ email: 'statsuser2@bikehub.com' });

      const res = await request(app)
        .get('/api/admin/stats')
        .set(authHeader(adminToken));

      expect(res.statusCode).toBe(200);
      expect(res.body.totalUsers).toBeGreaterThanOrEqual(2);
    });

    it('50. deactivated user account should be blocked from protected routes', async () => {
      await createUserInDb({
        email: 'inactive@bikehub.com',
        password: 'Password123!'
      });

      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'inactive@bikehub.com',
          password: encodePassword('Password123!')
        })
        .expect(200);

      const user = await User.findOne({ email: 'inactive@bikehub.com' });
      user.otpCode = '998877';
      user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
      await user.save();

      const verifyRes = await request(app)
        .post('/api/auth/verify-otp')
        .send({ email: 'inactive@bikehub.com', otp: '998877' });

      const token = verifyRes.body.token;
      user.isActive = false;
      await user.save();

      const res = await request(app)
        .get('/api/auth/me')
        .set(authHeader(token));

      expect(res.statusCode).toBe(401);
    });

    it('51. admin can remove user-related dealer account via DELETE /api/admin/dealers/:id', async () => {
      const dealer = await createDealerInDb({ email: 'deldealer@bikehub.com' });
      const res = await request(app)
        .delete(`/api/admin/dealers/${dealer._id}`)
        .set(authHeader(adminToken));

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain('deleted');
      expect(await Dealer.findById(dealer._id)).toBeNull();
    });
  });

  describe('Inventory & bookings oversight', () => {
    let adminToken;

    beforeEach(async () => {
      ({ token: adminToken } = await getAdminToken());
    });

    it('52. GET /api/admin/stats should include full bike inventory count', async () => {
      await createBikeInDb({ name: 'Inventory Bike 1' });
      await createBikeInDb({ name: 'Inventory Bike 2' });

      const res = await request(app)
        .get('/api/admin/stats')
        .set(authHeader(adminToken));

      expect(res.statusCode).toBe(200);
      expect(res.body.totalBikes).toBeGreaterThanOrEqual(2);
    });

    it('53. GET /api/admin/stats should include recent test ride bookings', async () => {
      const { user } = await getAuthToken();
      const bike = await createBikeInDb();
      const dealer = await createDealerInDb();
      const future = new Date();
      future.setDate(future.getDate() + 4);

      await Booking.create({
        user: user._id,
        bike: bike._id,
        dealer: dealer._id,
        bookingDate: future,
        preferredTime: '14:00',
        status: 'pending'
      });

      const res = await request(app)
        .get('/api/admin/stats')
        .set(authHeader(adminToken));

      expect(res.statusCode).toBe(200);
      expect(res.body.totalBookings).toBeGreaterThanOrEqual(1);
      expect(res.body.recentBookings.length).toBeGreaterThanOrEqual(1);
    });

    it('54. PUT /api/bookings/:id/reject admin should update booking status', async () => {
      const bike = await createBikeInDb();
      const dealer = await createDealerInDb();
      const user = await createUserInDb();
      const future = new Date();
      future.setDate(future.getDate() + 4);

      const booking = await Booking.create({
        user: user._id,
        bike: bike._id,
        dealer: dealer._id,
        bookingDate: future,
        preferredTime: '14:15',
        status: 'pending'
      });

      const res = await request(app)
        .put(`/api/bookings/${booking._id}/reject`)
        .set(authHeader(adminToken))
        .send({ message: 'Slot unavailable' });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('rejected');
    });
  });

  describe('Dealership management - /api/admin/dealers', () => {
    let adminToken;

    beforeEach(async () => {
      ({ token: adminToken } = await getAdminToken());
    });

    it('55. POST /api/admin/dealers should add a new dealership location', async () => {
      const dealerData = generateTestDealer({ email: 'newdealer@bikehub.com' });
      const res = await request(app)
        .post('/api/admin/dealers')
        .set(authHeader(adminToken))
        .send(dealerData);

      expect(res.statusCode).toBe(201);
      expect(res.body.dealer.name).toBe(dealerData.name);
      expect(emailService.sendDealerWelcomeEmail).toHaveBeenCalled();
    });

    it('56. GET /api/admin/dealers should list dealerships for admin update workflow', async () => {
      await createDealerInDb({ name: 'Listed Dealer', email: 'listed@bikehub.com' });
      const res = await request(app)
        .get('/api/admin/dealers')
        .set(authHeader(adminToken));

      expect(res.statusCode).toBe(200);
      expect(res.body.some((d) => d.name === 'Listed Dealer')).toBe(true);
    });

    it('57. DELETE /api/admin/dealers/:id should delete a dealership', async () => {
      const dealer = await createDealerInDb({ email: 'remove@bikehub.com' });
      const res = await request(app)
        .delete(`/api/admin/dealers/${dealer._id}`)
        .set(authHeader(adminToken));

      expect(res.statusCode).toBe(200);
      expect(await Dealer.findById(dealer._id)).toBeNull();
    });
  });

  describe('Advertisement (promotion) management - /api/admin/promotions', () => {
    let adminToken;

    beforeEach(async () => {
      ({ token: adminToken } = await getAdminToken());
    });

    it('58. POST /api/admin/promotions should create a new advertisement', async () => {
      const promo = generateTestPromotion({ title: 'Festive Offer' });
      const res = await request(app)
        .post('/api/admin/promotions')
        .set(authHeader(adminToken))
        .send(promo);

      expect(res.statusCode).toBe(201);
      expect(res.body.title).toBe('Festive Offer');
    });

    it('59. PUT /api/admin/promotions/:id should update an advertisement', async () => {
      const promo = await createPromotionInDb({ title: 'Old Title' });
      const res = await request(app)
        .put(`/api/admin/promotions/${promo._id}`)
        .set(authHeader(adminToken))
        .send({ title: 'Updated Title', image: promo.image });

      expect(res.statusCode).toBe(200);
      expect(res.body.title).toBe('Updated Title');
    });

    it('60. DELETE /api/admin/promotions/:id should delete an advertisement', async () => {
      const promo = await createPromotionInDb({ title: 'Delete Me' });
      const res = await request(app)
        .delete(`/api/admin/promotions/${promo._id}`)
        .set(authHeader(adminToken));

      expect(res.statusCode).toBe(200);
      expect(await Promotion.findById(promo._id)).toBeNull();
    });
  });
});
