import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import User from '../models/User.model.js';
import Bike from '../models/Bike.model.js';
import Booking from '../models/Booking.model.js';
import Dealer from '../models/Dealer.model.js';
import Promotion from '../models/Promotion.model.js';
import { generateToken } from '../utils/generateToken.js';

export { app, request };

export const encodePassword = (plain) => Buffer.from(plain).toString('base64');

export function generateTestUser(overrides = {}) {
  const id = new mongoose.Types.ObjectId();
  return {
    _id: id,
    name: 'Test User',
    email: `user_${id.toString().slice(-6)}@bikehub.com`,
    password: 'Password123!',
    phone: '9800000001',
    role: 'user',
    ...overrides
  };
}

export function generateTestAdmin(overrides = {}) {
  const id = new mongoose.Types.ObjectId();
  return {
    _id: id,
    name: 'Test Admin',
    email: `admin_${id.toString().slice(-6)}@bikehub.com`,
    password: 'AdminPass123!',
    phone: '9800000002',
    role: 'admin',
    ...overrides
  };
}

export function generateTestBike(overrides = {}) {
  return {
    name: 'Yamaha R15 V4',
    brand: 'Yamaha',
    category: 'Sports',
    price: 550000,
    exShowroomPrice: 500000,
    description: 'Premium sports bike for testing.',
    specifications: {
      engine: { displacement: '155cc', maxPower: '18.6 PS' },
      colors: ['Racing Blue', 'Matte Black']
    },
    isAvailable: true,
    availabilityStatus: 'available',
    ...overrides
  };
}

export function generateTestDealer(overrides = {}) {
  const id = new mongoose.Types.ObjectId();
  return {
    name: 'Kathmandu Showroom',
    type: 'showroom',
    email: `dealer_${id.toString().slice(-6)}@bikehub.com`,
    phone: '9800000003',
    address: {
      street: 'Thamel',
      city: 'Kathmandu',
      state: 'Bagmati',
      country: 'Nepal'
    },
    location: {
      latitude: 27.7172,
      longitude: 85.3240,
      mapLink: 'https://www.google.com/maps?q=27.7172,85.3240'
    },
    isActive: true,
    ...overrides
  };
}

export function generateTestBooking(overrides = {}) {
  const future = new Date();
  future.setDate(future.getDate() + 3);
  return {
    bookingDate: future,
    preferredTime: '09:00',
    status: 'pending',
    message: 'Test ride please',
    userName: 'Test User',
    bikeModel: 'Yamaha R15 V4',
    bookingTime: '09:00',
    dealership: 'Kathmandu Showroom',
    ...overrides
  };
}

export function generateTestPromotion(overrides = {}) {
  return {
    title: 'Summer Sale',
    description: 'Big discounts on sports bikes',
    image: '/uploads/promo-test.jpg',
    link: '/bikes',
    isActive: true,
    priority: 1,
    ...overrides
  };
}

export async function createUserInDb(overrides = {}) {
  const data = generateTestUser(overrides);
  const { password, _id, ...rest } = data;
  return User.create({
    ...rest,
    email: overrides.email || data.email,
    password: overrides.password || password
  });
}

export async function createAdminInDb(overrides = {}) {
  return createUserInDb({ ...generateTestAdmin(), ...overrides, role: 'admin' });
}

export async function createBikeInDb(overrides = {}) {
  return Bike.create(generateTestBike(overrides));
}

export async function createDealerInDb(overrides = {}) {
  return Dealer.create(generateTestDealer(overrides));
}

export async function registerUserViaApi(userPayload = {}) {
  const user = generateTestUser(userPayload);
  const res = await request(app)
    .post('/api/auth/register')
    .send({
      name: user.name,
      email: user.email,
      password: encodePassword(user.password),
      phone: user.phone
    });
  return { res, user, token: res.body.token };
}

export async function setUserOtp(email, otp = '123456') {
  const user = await User.findOne({ email });
  if (!user) throw new Error(`User not found: ${email}`);
  user.otpCode = otp;
  user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
  user.otpAttempts = 0;
  await user.save();
  return otp;
}

export async function getAuthToken(userOverrides = {}) {
  const { user } = await registerUserViaApi(userOverrides);
  await request(app)
    .post('/api/auth/login')
    .send({ email: user.email, password: encodePassword(user.password) })
    .expect(200);

  const otp = await setUserOtp(user.email);
  const verifyRes = await request(app)
    .post('/api/auth/verify-otp')
    .send({ email: user.email, otp })
    .expect(200);

  return { token: verifyRes.body.token, user: verifyRes.body, plainPassword: user.password };
}

export async function getAdminToken(adminOverrides = {}) {
  const admin = await createAdminInDb(adminOverrides);
  const token = generateToken(admin._id);
  return { token, admin };
}

export async function seedBookingGraph() {
  const { token, user } = await getAuthToken();
  const bike = await createBikeInDb();
  const dealer = await createDealerInDb();
  const bookingData = generateTestBooking();
  const booking = await Booking.create({
    user: user._id,
    bike: bike._id,
    dealer: dealer._id,
    bookingDate: bookingData.bookingDate,
    preferredTime: bookingData.preferredTime,
    status: 'pending'
  });
  return { token, user, bike, dealer, booking };
}

export function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

export async function createPromotionInDb(overrides = {}) {
  return Promotion.create(generateTestPromotion(overrides));
}
