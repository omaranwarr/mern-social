/**
 * Unit tests for user input validation (XSS prevention).
 * Behavior protected: scripts are not executed; they are stored and displayed as plain text.
 * Test approach: inserting XSS scripts through API (depicting frontend user input).
 */
jest.mock('../helpers/email', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue({ success: true })
}))

import request from 'supertest'
import jwt from 'jsonwebtoken'
import app from '../test-app'
import User from '../models/user.model'
import Post from '../models/post.model'
import PendingSignup from '../models/pendingSignup.model'
import config from '../../config/config'

const MINI_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
)

const XSS_SCRIPT = '<script>alert("xss")</script>'
const XSS_ESCAPED = '&lt;script&gt;alert("xss")&lt;/script&gt;'

const createAuthToken = (userId) =>
  jwt.sign({ _id: userId }, config.jwtSecret)

describe('User input validation (XSS prevention)', () => {
  let testUser
  let authToken

  beforeEach(async () => {
    await Post.deleteMany({})
    await PendingSignup.deleteMany({})
    await User.deleteMany({ email: 'xsstest@example.com' })
    testUser = new User({
      name: 'XSS Test User',
      email: 'xsstest@example.com',
      password: 'password123'
    })
    testUser._password = '[test]'
    await testUser.save()
    authToken = createAuthToken(testUser._id)
  })

  describe('Post text sanitization', () => {
    it('stores XSS in post text as escaped plain text (not executable)', async () => {
      const res = await request(app)
        .post(`/api/posts/new/${testUser._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .field('text', XSS_SCRIPT)
        .attach('photo', MINI_PNG, 'image.png')
        .expect(200)

      expect(res.body.text).toBe(XSS_ESCAPED)
      expect(res.body.text).not.toContain('<script>')
      expect(res.body.text).not.toContain('</script>')
    })

    it('allows normal text in posts unchanged', async () => {
      const normalText = 'Hello, this is safe content!'
      const res = await request(app)
        .post(`/api/posts/new/${testUser._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .field('text', normalText)
        .attach('photo', MINI_PNG, 'image.png')
        .expect(200)

      expect(res.body.text).toBe(normalText)
    })
  })

  describe('Comment text sanitization', () => {
    let postId

    beforeEach(async () => {
      const postRes = await request(app)
        .post(`/api/posts/new/${testUser._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .field('text', 'Post for comment test')
        .attach('photo', MINI_PNG, 'image.png')
      postId = postRes.body._id
    })

    it('stores XSS in comment text as escaped plain text (not executable)', async () => {
      const res = await request(app)
        .put('/api/posts/comment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          postId,
          userId: testUser._id,
          comment: { text: XSS_SCRIPT }
        })
        .expect(200)

      const newComment = res.body.comments.find(c => c.text.includes('script') || c.text.includes('alert'))
      expect(newComment).toBeDefined()
      expect(newComment.text).toBe(XSS_ESCAPED)
      expect(newComment.text).not.toContain('<script>')
    })
  })

  describe('User profile sanitization', () => {
    it('stores XSS in user name as escaped when updating profile', async () => {
      const res = await request(app)
        .put(`/api/users/${testUser._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .field('name', XSS_SCRIPT)
        .expect(200)

      expect(res.body.name).toBe(XSS_ESCAPED)
      expect(res.body.name).not.toContain('<script>')
    })

    it('stores XSS in user about as escaped when updating profile', async () => {
      const res = await request(app)
        .put(`/api/users/${testUser._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .field('name', 'Updated Name')
        .field('about', XSS_SCRIPT)
        .expect(200)

      expect(res.body.about).toBe(XSS_ESCAPED)
      expect(res.body.about).not.toContain('<script>')
    })
  })

  describe('Signup name sanitization', () => {
    it('stores XSS in signup name as escaped (user created after verify)', async () => {
      const email = 'xss-signup@example.com'
      await User.deleteMany({ email })
      await PendingSignup.deleteMany({ email })

      const signupRes = await request(app)
        .post('/api/users')
        .send({
          name: XSS_SCRIPT,
          email,
          password: 'password123'
        })
        .expect(200)

      const pending = await PendingSignup.findOne({ email })
      expect(pending).not.toBeNull()
      expect(pending.name).toBe(XSS_ESCAPED)

      const verifyRes = await request(app)
        .post('/api/users/verify-email')
        .send({
          verificationToken: signupRes.body.verificationToken,
          code: pending.verificationCode
        })
        .expect(200)

      const user = await User.findOne({ email })
      expect(user).not.toBeNull()
      expect(user.name).toBe(XSS_ESCAPED)
      expect(user.name).not.toContain('<script>')
    })
  })
})
