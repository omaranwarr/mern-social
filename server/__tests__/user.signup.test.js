/**
 * API tests for email verification (2FA) signup flow.
 * - POST /api/users: creates pending signup, sends code (mocked), returns verificationToken
 * - POST /api/users/verify-email: verifies code and creates user
 */
jest.mock('../helpers/email', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue({ success: true })
}))

import request from 'supertest'
import app from '../test-app'
import User from '../models/user.model'
import PendingSignup from '../models/pendingSignup.model'

describe('Signup with email verification', () => {
  describe('POST /api/users (signup request)', () => {
    it('returns 400 when name, email, or password is missing', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({ name: 'Test', email: 'test@example.com' })
        .expect(400)
      expect(res.body.error).toMatch(/required/i)
    })

    it('returns 200 and verificationToken when signup request succeeds', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({
          name: 'Test User',
          email: 'signup-test@example.com',
          password: 'password123'
        })
        .expect(200)
      expect(res.body.verificationToken).toBeDefined()
      expect(typeof res.body.verificationToken).toBe('string')
      expect(res.body.message).toMatch(/verification code/i)
    })

    it('does not create a User; creates PendingSignup only', async () => {
      const email = 'pending-only@example.com'
      await request(app)
        .post('/api/users')
        .send({ name: 'Pending', email, password: 'password123' })
        .expect(200)

      const user = await User.findOne({ email })
      expect(user).toBeNull()

      const pending = await PendingSignup.findOne({ email })
      expect(pending).not.toBeNull()
      expect(pending.verificationCode).toBeDefined()
      expect(pending.verificationToken).toBeDefined()
    })

    it('returns 400 when email already exists as a User', async () => {
      const email = 'existing@example.com'
      await request(app)
        .post('/api/users')
        .send({ name: 'First', email, password: 'password123' })
        .expect(200)
      await request(app)
        .post('/api/users/verify-email')
        .send({
          verificationToken: (await PendingSignup.findOne({ email })).verificationToken,
          code: (await PendingSignup.findOne({ email })).verificationCode
        })
        .expect(200)

      const res = await request(app)
        .post('/api/users')
        .send({ name: 'Second', email, password: 'other456' })
        .expect(400)
      expect(res.body.error).toMatch(/already exists/i)
    })
  })

  describe('POST /api/users/verify-email', () => {
    it('returns 400 when verificationToken or code is missing', async () => {
      await request(app)
        .post('/api/users/verify-email')
        .send({ verificationToken: 'abc' })
        .expect(400)
      await request(app)
        .post('/api/users/verify-email')
        .send({ code: '123456' })
        .expect(400)
    })

    it('returns 400 for invalid or wrong code', async () => {
      const email = 'verify-invalid@example.com'
      await request(app)
        .post('/api/users')
        .send({ name: 'Verify', email, password: 'password123' })
        .expect(200)

      const pending = await PendingSignup.findOne({ email })
      const res = await request(app)
        .post('/api/users/verify-email')
        .send({
          verificationToken: pending.verificationToken,
          code: '000000'
        })
        .expect(400)
      expect(res.body.error).toMatch(/invalid|expired/i)
    })

    it('returns 200 and creates User when code is valid', async () => {
      const email = 'verify-ok@example.com'
      const resSignup = await request(app)
        .post('/api/users')
        .send({ name: 'Verified User', email, password: 'password123' })
        .expect(200)

      const pending = await PendingSignup.findOne({ email })
      const res = await request(app)
        .post('/api/users/verify-email')
        .send({
          verificationToken: resSignup.body.verificationToken,
          code: pending.verificationCode
        })
        .expect(200)
      expect(res.body.message).toMatch(/successfully signed up/i)

      const user = await User.findOne({ email })
      expect(user).not.toBeNull()
      expect(user.name).toBe('Verified User')
      expect(user.email).toBe(email)

      const pendingAfter = await PendingSignup.findOne({ email })
      expect(pendingAfter).toBeNull()
    })
  })
})
