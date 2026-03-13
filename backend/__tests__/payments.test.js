const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:2840@localhost:5432/template1?sslmode=disable'
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const app = require('../src/server');

describe('API de Pagos', () => {
  let adminToken;
  let ownerToken;
  let ownerId;

  beforeAll(async () => {
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'david.busso95@gmail.com', password: '2840' });
    adminToken = adminLogin.body.token;

    const testOwner = {
      name: 'Owner Test',
      email: `owner${Date.now()}@test.com`,
      password: 'owner123',
      unitNumber: 'B202',
      role: 'OWNER'
    };

    await request(app)
      .post('/api/auth/register')
      .send(testOwner);

    const ownerLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: testOwner.email, password: testOwner.password });
    
    ownerToken = ownerLogin.body.token;
    ownerId = ownerLogin.body.user.id;
  });

  afterAll(async () => {
    await prisma.payment.deleteMany({
      where: { userId }
    });
    await prisma.$disconnect();
  });

  describe('POST /api/payments (Crear pago)', () => {
    it('debería crear un pago exitosamente como propietario', async () => {
      const paymentData = {
        amount: 100,
        currency: 'ARS',
        periodYear: 2026,
        periodMonth: 3,
        paymentDate: '2026-03-13',
        method: 'Transferencia'
      };

      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(paymentData);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.amount).toBe('100.00');
    });

    it('debería fallar sin datos requeridos', async () => {
      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ amount: 100 });

      expect(res.status).toBe(400);
    });

    it('debería fallar sin autenticación', async () => {
      const res = await request(app)
        .post('/api/payments')
        .send({ amount: 100, currency: 'ARS' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/payments/my (Mis pagos)', () => {
    it('debería obtener los pagos del usuario autenticado', async () => {
      const res = await request(app)
        .get('/api/payments/my')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('debería fallar sin token', async () => {
      const res = await request(app)
        .get('/api/payments/my');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/payments (Admin)', () => {
    it('debería obtener todos los pagos como admin', async () => {
      const res = await request(app)
        .get('/api/payments')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('debería filtrar por año y mes', async () => {
      const res = await request(app)
        .get('/api/payments?year=2026&month=3')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });
  });
});
