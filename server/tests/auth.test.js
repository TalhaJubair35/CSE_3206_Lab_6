jest.mock('../src/models/User', () => ({
  findOne: jest.fn(),
  create: jest.fn()
}));

jest.mock('../src/config/firebase', () => ({
  getFirebaseAuth: jest.fn()
}));

const express = require('express');
const request = require('supertest');
const User = require('../src/models/User');
const { getFirebaseAuth } = require('../src/config/firebase');
const authenticate = require('../src/middleware/auth');
const { requireRole } = require('../src/middleware/auth');
const authService = require('../src/services/authService');
const app = require('../src/app');

describe('Firebase authentication and MongoDB user profiles', () => {
  const firebaseUser = {
    uid: 'firebase-user-1',
    email: 'student@example.edu'
  };
  const profile = {
    _id: { toString: () => 'mongo-user-1' },
    firebaseUid: firebaseUser.uid,
    email: firebaseUser.email,
    role: 'student'
  };
  let verifyIdToken;

  beforeEach(() => {
    User.findOne.mockReset();
    User.create.mockReset();
    delete process.env.ORGANIZER_EMAILS;
    User.findOne.mockResolvedValue({
      ...profile,
      save: jest.fn().mockResolvedValue(profile)
    });
    verifyIdToken = jest.fn().mockResolvedValue(firebaseUser);
    getFirebaseAuth.mockReturnValue({ verifyIdToken });
  });

  test('creates a MongoDB profile from a verified Firebase registration token', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue(profile);

    const response = await request(app)
      .post('/api/auth/register')
      .set('Authorization', 'Bearer firebase-id-token');

    expect(response.status).toBe(201);
    expect(response.body.user).toEqual({
      id: 'mongo-user-1',
      email: 'student@example.edu',
      role: 'student'
    });
    expect(verifyIdToken).toHaveBeenCalledWith('firebase-id-token');
    expect(User.create).toHaveBeenCalledWith({
      firebaseUid: 'firebase-user-1',
      email: 'student@example.edu',
      role: 'student'
    });
  });

  test('rejects duplicate email ownership when syncing a Firebase profile', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockRejectedValue({ code: 11000 });

    await expect(authService.registerUser({ firebaseUser }))
      .rejects.toMatchObject({ status: 409 });
  });

  test('returns the MongoDB profile after a verified Firebase login', async () => {
    User.findOne.mockResolvedValue({
      ...profile,
      save: jest.fn().mockResolvedValue(profile)
    });

    const response = await request(app)
      .post('/api/auth/login')
      .set('Authorization', 'Bearer firebase-id-token');

    expect(response.status).toBe(200);
    expect(response.body.user).toMatchObject({
      id: 'mongo-user-1',
      email: 'student@example.edu',
      role: 'student'
    });
  });

  test('promotes only an allowlisted email to organizer on login', async () => {
    process.env.ORGANIZER_EMAILS = 'organizer@example.edu';
    const existing = {
      ...profile,
      role: 'student',
      email: 'organizer@example.edu',
      save: jest.fn().mockImplementation(function () { return this; })
    };
    User.findOne.mockResolvedValue(existing);

    const result = await authService.loginUser({
      firebaseUser: { uid: firebaseUser.uid, email: 'Organizer@Example.edu' }
    });

    expect(result.role).toBe('organizer');
    expect(existing.save).toHaveBeenCalledTimes(1);
  });

  test('rejects requests without or with an invalid Firebase ID token', async () => {
    const missing = await request(app).post('/api/auth/login');
    verifyIdToken.mockRejectedValueOnce(new Error('invalid token'));
    const invalid = await request(app)
      .post('/api/auth/login')
      .set('Authorization', 'Bearer bad-token');

    expect(missing.status).toBe(401);
    expect(invalid.status).toBe(401);
  });

  test('loads the MongoDB role for a protected request', async () => {
    User.findOne.mockResolvedValue(profile);
    const protectedApp = express();
    protectedApp.get('/private', authenticate, (req, res) => res.json({ user: req.user }));

    const response = await request(protectedApp)
      .get('/private')
      .set('Authorization', 'Bearer firebase-id-token');

    expect(response.status).toBe(200);
    expect(response.body.user).toMatchObject({
      id: 'mongo-user-1',
      firebaseUid: 'firebase-user-1',
      role: 'student'
    });
    expect(User.findOne).toHaveBeenCalledWith({ firebaseUid: 'firebase-user-1' });
  });

  test('denies access when the MongoDB role does not satisfy authorization', async () => {
    User.findOne.mockResolvedValue(profile);
    const protectedApp = express();
    protectedApp.get('/admin', authenticate, requireRole('admin'), (req, res) => res.sendStatus(204));

    const response = await request(protectedApp)
      .get('/admin')
      .set('Authorization', 'Bearer firebase-id-token');

    expect(response.status).toBe(403);
  });
});
