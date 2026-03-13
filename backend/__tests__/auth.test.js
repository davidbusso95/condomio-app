const request = require('supertest');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:2840@localhost:5432/template1?sslmode=disable'
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const app = require('../src/server');

describe('API de Autenticación', () => {
  const testUser = {
    name: 'Test User',
    email: `test${Date.now()}@example.com`,
    password: 'testPassword123',
    unitNumber: 'A101'
  };

  let token;
  let userId;

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/auth/register', () => {
    it('debería registrar un nuevo usuario exitosamente', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.email).toBe(testUser.email);
      expect(res.body).not.toHaveProperty('passwordHash');
    });

    it('debería fallar con email duplicado', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('ya está registrado');
    });

    it('debería fallar sin email o contraseña', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('debería iniciar sesión exitosamente', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      token = res.body.token;
      userId = res.body.user.id;
    });

    it('debería fallar con contraseña incorrecta', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'wrongpassword' });

      expect(res.status).toBe(401);
    });

    it('debería fallar con email inexistente', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'password' });

      expect(res.status).toBe(401);
    });
  });

  describe('Seguridad', () => {
    it('debería rechazar token inválido', async () => {
      const res = await request(app)
        .get('/api/payments')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
    });

    it('debería permitir acceso sin token', async () => {
      const res = await request(app)
        .get('/');

      expect(res.status).toBe(200);
    });
  });
});
