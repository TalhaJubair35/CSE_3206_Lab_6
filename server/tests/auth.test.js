jest.mock('../src/models/User', () => ({
  create: jest.fn(),
  findOne: jest.fn(),
  hashPassword: jest.fn()
}));

const express = require('express');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const User = require('../src/models/User');
const authService = require('../src/services/authService');
const authenticate = require('../src/middleware/auth');
const app = require('../src/app');

describe('authentication', () => {
  const originalSecret = process.env.JWT_SECRET;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    User.create.mockReset();
    User.findOne.mockReset();
    User.hashPassword.mockReset();
  });

  afterAll(() => {
    if (originalSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalSecret;
    }

    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  test('registers a normalized user with a password hash', async () => {
    const user = { _id: 'user-id', email: 'student@example.edu', role: 'student' };
    User.hashPassword.mockResolvedValue('hashed-password');
    User.create.mockResolvedValue(user);

    const response = await request(app)
      .post('/api/auth/register')
      .send({ email: ' Student@Example.edu ', password: 'secret' });

    expect(response.status).toBe(201);
    expect(response.body.user).toEqual({
      id: 'user-id',
      email: 'student@example.edu',
      role: 'student'
    });
    expect(User.create).toHaveBeenCalledWith({
      email: 'student@example.edu',
      passwordHash: 'hashed-password'
    });
  });

  test('rejects invalid registration input with status 400', async () => {
    await expect(authService.registerUser({ email: 'not-an-email', password: 'secret' }))
      .rejects.toMatchObject({ status: 400 });
  });

  test('returns a signed JWT for valid credentials', async () => {
    User.findOne.mockResolvedValue({
      _id: { toString: () => 'user-id' },
      role: 'organizer',
      comparePassword: jest.fn().mockResolvedValue(true)
    });

    const token = await authService.loginUser({
      email: ' Organizer@Example.edu ',
      password: 'secret'
    });

    expect(User.findOne).toHaveBeenCalledWith({ email: 'organizer@example.edu' });
    expect(jwt.verify(token, 'test-secret')).toMatchObject({
      id: 'user-id',
      role: 'organizer'
    });
  });

  test('rejects wrong credentials with status 401', async () => {
    User.findOne.mockResolvedValue({
      comparePassword: jest.fn().mockResolvedValue(false)
    });

    await expect(authService.loginUser({ email: 'student@example.edu', password: 'wrong' }))
      .rejects.toMatchObject({ status: 401 });
  });

  test('protects /me and returns the authenticated user claims', async () => {
    const token = jwt.sign(
      { id: 'user-id', role: 'student' },
      'test-secret'
    );
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.user).toEqual({ id: 'user-id', role: 'student' });
  });

  test('returns 401 for a missing or invalid bearer token', async () => {
    const missing = await request(app).get('/api/auth/me');
    const invalid = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid');

    expect(missing.status).toBe(401);
    expect(invalid.status).toBe(401);
  });

  test('requireRole rejects a user without an allowed role', async () => {
    const roleApp = express();
    roleApp.get('/admin', authenticate, requireAdmin, (req, res) => res.sendStatus(204));

    const token = jwt.sign({ id: 'user-id', role: 'student' }, 'test-secret');
    const response = await request(roleApp)
      .get('/admin')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
  });
});

const { requireRole } = require('../src/middleware/auth');
const requireAdmin = requireRole('admin');
