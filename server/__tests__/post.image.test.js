/**
 * Unit/integration tests for caption-less image posts.
 * Behavior protected: pictures can be posted without a caption.
 */
import request from 'supertest'
import jwt from 'jsonwebtoken'
import fs from 'fs'
import path from 'path'
import app from '../test-app'
import User from '../models/user.model'
import Post from '../models/post.model'
import config from '../../config/config'

// Create a small valid PNG (1x1 pixel) for testing
const MINI_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
)

const createAuthToken = (userId) =>
  jwt.sign({ _id: userId }, config.jwtSecret)

describe('Caption-less image posts', () => {
  let testUser
  let authToken

  beforeEach(async () => {
    await Post.deleteMany({})
    await User.deleteMany({ email: 'posttest@example.com' })
    testUser = new User({
      name: 'Post Test User',
      email: 'posttest@example.com',
      password: 'password123'
    })
    testUser._password = '[test]' // satisfy User model validator
    await testUser.save()
    authToken = createAuthToken(testUser._id)
  })

  describe('POST /api/posts/new/:userId', () => {
    it('creates a post with photo and no caption (text empty)', async () => {
      const res = await request(app)
        .post(`/api/posts/new/${testUser._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .field('text', '')
        .attach('photo', MINI_PNG, 'image.png')
        .expect(200)

      expect(res.body._id).toBeDefined()
      expect(res.body.postedBy._id).toBe(testUser._id.toString())
      expect(res.body.text).toBe('')
      expect(res.body.photo).toBeDefined()
    })

    it('creates a post with caption and photo', async () => {
      const res = await request(app)
        .post(`/api/posts/new/${testUser._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .field('text', 'My caption')
        .attach('photo', MINI_PNG, 'image.png')
        .expect(200)

      expect(res.body.text).toBe('My caption')
      expect(res.body.photo).toBeDefined()
    })

    it('rejects post with neither text nor photo', async () => {
      const res = await request(app)
        .post(`/api/posts/new/${testUser._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .field('text', '')
        .expect(400)

      expect(res.body.error).toMatch(/text or a photo/i)
    })

    it('creates a text-only post (no photo)', async () => {
      const res = await request(app)
        .post(`/api/posts/new/${testUser._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .field('text', 'Just text')
        .expect(200)

      expect(res.body.text).toBe('Just text')
    })
  })
})
