import mongoose from 'mongoose';
import Booking from '../models/Booking.model.js';
import {
  app,
  request,
  getAuthToken,
  getAdminToken,
  createBikeInDb,
  createDealerInDb,
  createUserInDb,
  authHeader,
  generateTestBooking
} from './testUtils.js';

describe('Module 3: Test Ride Booking Management', () => {
  let userToken;
  let userId;
  let bike;
  let dealer;

  beforeEach(async () => {
    const auth = await getAuthToken({ email: `booker_${Date.now()}@bikehub.com` });
    userToken = auth.token;
    userId = auth.user._id;
    bike = await createBikeInDb();
    dealer = await createDealerInDb();
  });

  const futureDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split('T')[0];
  };

  const bookingPayload = (overrides = {}) => ({
    bike: bike._id.toString(),
    dealer: dealer._id.toString(),
    bookingDate: futureDate(),
    preferredTime: '09:15',
    message: 'Looking forward to the test ride',
    ...overrides
  });

  describe('Create booking - POST /api/bookings', () => {
    it('32. should create a test ride booking with valid data', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set(authHeader(userToken))
        .send(bookingPayload());

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.status).toBe('pending');
      expect(res.body.preferredTime).toBe('09:15');
    });

    it('33. should fail if user is not authenticated', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .send(bookingPayload());

      expect(res.statusCode).toBe(401);
    });

    it('34. should fail if dealer ID is invalid (dealer not found)', async () => {
      const fakeDealer = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post('/api/bookings')
        .set(authHeader(userToken))
        .send(bookingPayload({ dealer: fakeDealer.toString() }));

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toContain('Dealer not found');
    });

    it('35. should reject booking with a past date when fields are invalid', async () => {
      const past = new Date();
      past.setDate(past.getDate() - 2);
      const res = await request(app)
        .post('/api/bookings')
        .set(authHeader(userToken))
        .send(bookingPayload({
          bookingDate: past.toISOString().split('T')[0],
          preferredTime: '25:99'
        }));

      expect(res.statusCode).toBeGreaterThanOrEqual(400);
    });

    it('36. should fail if time slot is already booked at that dealership', async () => {
      const payload = bookingPayload({ preferredTime: '10:00' });
      await request(app)
        .post('/api/bookings')
        .set(authHeader(userToken))
        .send(payload)
        .expect(201);

      const otherUser = await getAuthToken({ email: `other_${Date.now()}@bikehub.com` });
      const conflict = await request(app)
        .post('/api/bookings')
        .set(authHeader(otherUser.token))
        .send(payload);

      expect(conflict.statusCode).toBe(409);
      expect(conflict.body.message).toContain('already booked');
    });

    it('37. should return populated booking confirmation payload after booking', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set(authHeader(userToken))
        .send(bookingPayload());

      expect(res.statusCode).toBe(201);
      expect(res.body.bike).toHaveProperty('name');
      expect(res.body.dealer).toHaveProperty('name');
      expect(res.body.user).toHaveProperty('email');
    });
  });

  describe('User bookings - GET /api/bookings', () => {
    it('38. should return all bookings for logged-in user', async () => {
      await request(app)
        .post('/api/bookings')
        .set(authHeader(userToken))
        .send(bookingPayload())
        .expect(201);

      const res = await request(app)
        .get('/api/bookings')
        .set(authHeader(userToken));

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0].user._id || res.body[0].user).toBeTruthy();
    });

    it('39. should return empty array if user has no bookings', async () => {
      const res = await request(app)
        .get('/api/bookings')
        .set(authHeader(userToken));

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('Single booking - GET /api/bookings/:id', () => {
    it('40. should return correct booking details by booking ID', async () => {
      const created = await request(app)
        .post('/api/bookings')
        .set(authHeader(userToken))
        .send(bookingPayload());

      const res = await request(app)
        .get(`/api/bookings/${created.body._id}`)
        .set(authHeader(userToken));

      expect(res.statusCode).toBe(200);
      expect(res.body._id).toBe(created.body._id);
      expect(res.body.preferredTime).toBe('09:15');
    });

    it('41. should return 404 for non-existent booking ID', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/bookings/${fakeId}`)
        .set(authHeader(userToken));

      expect(res.statusCode).toBe(404);
    });
  });

  describe('Cancel booking - PUT /api/bookings/:id/cancel', () => {
    it('42. should cancel a booking successfully when booking is in the future', async () => {
      const created = await request(app)
        .post('/api/bookings')
        .set(authHeader(userToken))
        .send(bookingPayload());

      const res = await request(app)
        .put(`/api/bookings/${created.body._id}/cancel`)
        .set(authHeader(userToken))
        .send({ reason: 'Schedule conflict' });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('cancelled');
    });

    it('43. should fail to cancel if booking is already cancelled', async () => {
      const data = generateTestBooking();
      const booking = await Booking.create({
        user: userId,
        bike: bike._id,
        dealer: dealer._id,
        bookingDate: data.bookingDate,
        preferredTime: '11:00',
        status: 'cancelled'
      });

      const res = await request(app)
        .put(`/api/bookings/${booking._id}/cancel`)
        .set(authHeader(userToken))
        .send({ reason: 'Too late' });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('cancelled');
    });

    it('44. should update booking status to cancelled after cancel', async () => {
      const created = await request(app)
        .post('/api/bookings')
        .set(authHeader(userToken))
        .send(bookingPayload({ preferredTime: '11:15' }));

      await request(app)
        .put(`/api/bookings/${created.body._id}/cancel`)
        .set(authHeader(userToken))
        .expect(200);

      const saved = await Booking.findById(created.body._id);
      expect(saved.status).toBe('cancelled');
    });
  });

  describe('Admin & dealer booking actions', () => {
    it('45. GET /api/admin/stats admin should reflect bookings in the system', async () => {
      await request(app)
        .post('/api/bookings')
        .set(authHeader(userToken))
        .send(bookingPayload({ preferredTime: '12:00' }))
        .expect(201);

      const { token: adminToken } = await getAdminToken();
      const res = await request(app)
        .get('/api/admin/stats')
        .set(authHeader(adminToken));

      expect(res.statusCode).toBe(200);
      expect(res.body.totalBookings).toBeGreaterThanOrEqual(1);
      expect(res.body.recentBookings.length).toBeGreaterThanOrEqual(1);
    });

    it('46. PUT /api/bookings/:id/approve admin should approve a booking', async () => {
      const created = await request(app)
        .post('/api/bookings')
        .set(authHeader(userToken))
        .send(bookingPayload({ preferredTime: '13:00' }));

      const { token: adminToken } = await getAdminToken();
      const res = await request(app)
        .put(`/api/bookings/${created.body._id}/approve`)
        .set(authHeader(adminToken))
        .send({ message: 'Approved — see you at the showroom' });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('approved');
    });
  });
});
