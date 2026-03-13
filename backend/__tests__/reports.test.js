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

describe('API de Reportes', () => {
  let adminToken;
  let ownerToken;

  beforeAll(async () => {
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'david.busso95@gmail.com', password: '2840' });
    adminToken = adminLogin.body.token;

    const testOwner = {
      name: 'Owner Report Test',
      email: `ownerReport${Date.now()}@test.com`,
      password: 'owner123',
      unitNumber: 'D404',
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
    await prisma.$disconnect();
  });

  describe('GET /api/reports/summary (Estado de cuenta)', () => {
    it('debería obtener el resumen financiero como admin', async () => {
      const res = await request(app)
        .get('/api/reports/summary')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalPayments');
      expect(res.body).toHaveProperty('totalExpenses');
      expect(res.body).toHaveProperty('balance');
    });

    it('debería filtrar por período', async () => {
      const res = await request(app)
        .get('/api/reports/summary?year=2026&month=3')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it('debería fallar sin autenticación', async () => {
      const res = await request(app)
        .get('/api/reports/summary');

      expect(res.status).toBe(401);
    });

    it('debería fallar como no-admin', async () => {
      const res = await request(app)
        .get('/api/reports/summary')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/reports/pending-owners (Propietarios pendientes)', () => {
    it('debería obtener propietarios pendientes como admin', async () => {
      const res = await request(app)
        .get('/api/reports/pending-owners?year=2026&month=3')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('debería fallar sin año y mes', async () => {
      const res = await request(app)
        .get('/api/reports/pending-owners')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/reports/export-excel (Exportar)', () => {
    it('debería exportar a Excel como admin', async () => {
      const res = await request(app)
        .get('/api/reports/export-excel')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('spreadsheetml');
    });

    it('debería fallar como no-admin', async () => {
      const res = await request(app)
        .get('/api/reports/export-excel')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(403);
    });
  });
});
