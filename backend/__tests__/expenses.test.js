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

describe('API de Gastos', () => {
  let adminToken;
  let ownerToken;
  let expenseId;

  beforeAll(async () => {
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'david.busso95@gmail.com', password: '2840' });
    adminToken = adminLogin.body.token;

    const testOwner = {
      name: 'Owner Expense Test',
      email: `ownerExpense${Date.now()}@test.com`,
      password: 'owner123',
      unitNumber: 'C303',
      role: 'OWNER'
    };

    await request(app)
      .post('/api/auth/register')
      .send(testOwner);

    const ownerLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: testOwner.email, password: testOwner.password });
    
    ownerToken = ownerLogin.body.token;
  });

  afterAll(async () => {
    await prisma.expense.deleteMany({
      where: { id: expenseId }
    });
    await prisma.$disconnect();
  });

  describe('POST /api/expenses (Crear gasto)', () => {
    it('debería crear un gasto exitosamente como admin', async () => {
      const expenseData = {
        description: 'Limpieza del edificio',
        category: 'Limpieza',
        amount: 150,
        currency: 'ARS',
        expenseDate: '2026-03-13',
        invoiceNumber: 'FAC-001',
        supplier: 'Empresa de Limpieza C.A.'
      };

      const res = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(expenseData);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.description).toBe('Limpieza del edificio');
      expenseId = res.body.id;
    });

    it('debería fallar sin datos requeridos', async () => {
      const res = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: 100 });

      expect(res.status).toBe(400);
    });

    it('debería fallar sin autenticación', async () => {
      const res = await request(app)
        .post('/api/expenses')
        .send({ description: 'Test', amount: 100, currency: 'ARS' });

      expect(res.status).toBe(401);
    });

    it('debería fallar como usuario no-admin', async () => {
      const res = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ description: 'Test', amount: 100, currency: 'ARS' });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/expenses/latest (Últimos gastos)', () => {
    it('debería obtener los últimos gastos como admin', async () => {
      const res = await request(app)
        .get('/api/expenses/latest')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('debería fallar sin token', async () => {
      const res = await request(app)
        .get('/api/expenses/latest');

      expect(res.status).toBe(401);
    });

    it('debería fallar como no-admin', async () => {
      const res = await request(app)
        .get('/api/expenses/latest')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(403);
    });
  });
});
