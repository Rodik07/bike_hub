import mongoose from 'mongoose';
import {
  app,
  request,
  encodePassword,
  createBikeInDb,
  getAuthToken,
  getAdminToken,
  authHeader,
  generateTestBike
} from './testUtils.js';

describe('Module 2: Bike Management', () => {
  describe('Public bike catalogue', () => {
    it('15. GET /api/bikes should return list of all available bikes', async () => {
      await createBikeInDb({ name: 'Bike A', brand: 'Honda' });
      await createBikeInDb({ name: 'Bike B', brand: 'Yamaha' });

      const res = await request(app).get('/api/bikes');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
    });

    it('16. GET /api/bikes should return empty array if no bikes exist', async () => {
      const res = await request(app).get('/api/bikes');
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('17. GET /api/bikes/:id should return bike details for valid bike ID', async () => {
      const bike = await createBikeInDb({ name: 'Detail Bike' });
      const res = await request(app).get(`/api/bikes/${bike._id}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe('Detail Bike');
      expect(res.body).toHaveProperty('brand');
      expect(res.body).toHaveProperty('price');
    });

    it('18. GET /api/bikes/:id should return 404 for invalid bike ID', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/bikes/${fakeId}`);
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toContain('not found');
    });
  });

  describe('Search & filters (GET /api/bikes?query)', () => {
    beforeEach(async () => {
      await createBikeInDb({
        name: 'Yamaha R15',
        brand: 'Yamaha',
        category: 'Sports',
        price: 550000
      });
      await createBikeInDb({
        name: 'Honda CB350',
        brand: 'Honda',
        category: 'Cruiser',
        price: 750000
      });
    });

    it('19. GET /api/bikes?search= should return bikes matching search keyword', async () => {
      const res = await request(app).get('/api/bikes').query({ search: 'Yamaha' });
      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body.some((b) => b.brand === 'Yamaha')).toBe(true);
    });

    it('20. GET /api/bikes?search= should return empty array for no matching results', async () => {
      const res = await request(app).get('/api/bikes').query({ search: 'NonExistentBrandXYZ' });
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('21. GET /api/bikes?brand= should filter bikes by brand correctly', async () => {
      const res = await request(app).get('/api/bikes').query({ brand: 'Honda' });
      expect(res.statusCode).toBe(200);
      expect(res.body.every((b) => b.brand === 'Honda')).toBe(true);
    });

    it('22. GET /api/bikes?minPrice&maxPrice should filter bikes by price range correctly', async () => {
      const res = await request(app)
        .get('/api/bikes')
        .query({ minPrice: 500000, maxPrice: 600000 });
      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body.every((b) => b.price >= 500000 && b.price <= 600000)).toBe(true);
    });

    it('23. GET /api/bikes?category= should filter bikes by category correctly', async () => {
      const res = await request(app).get('/api/bikes').query({ category: 'Cruiser' });
      expect(res.statusCode).toBe(200);
      expect(res.body.every((b) => b.category === 'Cruiser')).toBe(true);
    });
  });

  describe('Bike comparison', () => {
    it('24. should return comparison data for two valid bike IDs (dual GET)', async () => {
      const bike1 = await createBikeInDb({ name: 'Compare A', brand: 'KTM', price: 400000 });
      const bike2 = await createBikeInDb({ name: 'Compare B', brand: 'KTM', price: 500000 });

      const [res1, res2] = await Promise.all([
        request(app).get(`/api/bikes/${bike1._id}`),
        request(app).get(`/api/bikes/${bike2._id}`)
      ]);

      expect(res1.statusCode).toBe(200);
      expect(res2.statusCode).toBe(200);
      expect(res1.body).toHaveProperty('specifications');
      expect(res2.body).toHaveProperty('specifications');
      expect(res1.body.price).not.toBe(res2.body.price);
    });

    it('25. POST /api/bikes/:id/compare should return 404 for invalid bike ID', async () => {
      const { token } = await getAuthToken();
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .post(`/api/bikes/${fakeId}/compare`)
        .set(authHeader(token));

      expect(res.statusCode).toBe(404);
    });
  });

  describe('Admin bike CRUD - /api/bikes', () => {
    let adminToken;

    beforeEach(async () => {
      ({ token: adminToken } = await getAdminToken());
    });

    it('26. POST /api/bikes admin should add a new bike with valid data', async () => {
      const payload = generateTestBike({ name: 'Admin Created Bike' });
      const res = await request(app)
        .post('/api/bikes')
        .set(authHeader(adminToken))
        .send(payload);

      expect(res.statusCode).toBe(201);
      expect(res.body.name).toBe('Admin Created Bike');
    });

    it('27. POST /api/bikes should fail if required bike fields are missing', async () => {
      const res = await request(app)
        .post('/api/bikes')
        .set(authHeader(adminToken))
        .send({ name: 'Incomplete Bike' });

      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBeTruthy();
    });

    it('28. PUT /api/bikes/:id admin should update existing bike details', async () => {
      const bike = await createBikeInDb({ name: 'Before Update' });
      const res = await request(app)
        .put(`/api/bikes/${bike._id}`)
        .set(authHeader(adminToken))
        .send({ price: 999999 });

      expect(res.statusCode).toBe(200);
      expect(res.body.price).toBe(999999);
    });

    it('29. PUT /api/bikes/:id should return 404 when updating non-existent bike', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/bikes/${fakeId}`)
        .set(authHeader(adminToken))
        .send({ price: 100 });

      expect(res.statusCode).toBe(404);
    });

    it('30. DELETE /api/bikes/:id admin should delete a bike successfully', async () => {
      const bike = await createBikeInDb({ name: 'To Delete' });
      const res = await request(app)
        .delete(`/api/bikes/${bike._id}`)
        .set(authHeader(adminToken));

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain('deleted');
    });

    it('31. DELETE /api/bikes/:id should return 403 if non-admin tries to delete', async () => {
      const bike = await createBikeInDb({ name: 'Protected Bike' });
      const { token: userToken } = await getAuthToken();

      const res = await request(app)
        .delete(`/api/bikes/${bike._id}`)
        .set(authHeader(userToken));

      expect(res.statusCode).toBe(403);
    });
  });
});
