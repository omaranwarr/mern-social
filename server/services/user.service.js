import crypto from 'crypto'
import User from '../models/user.model'

export const CODE_EXPIRY_MINUTES = 10
export const CODE_LENGTH = 6

/**
 * Safe values for PendingSignup.findOne (strings only; blocks NoSQL operator injection).
 * Token: 64 hex chars (generateVerificationToken). Code: CODE_LENGTH digits.
 * @returns {{ token: string, code: string } | null}
 */
export function parseVerifyEmailInput(rawToken, rawCode) {
  if (typeof rawToken !== 'string' || typeof rawCode !== 'string') {
    return null
  }
  const token = rawToken.trim()
  const code = rawCode.trim()
  const codeOk = new RegExp(`^\\d{${CODE_LENGTH}}$`).test(code)
  if (!/^[a-f0-9]{64}$/i.test(token) || !codeOk) {
    return null
  }
  return { token, code }
}

export function generateVerificationCode() {
  const max = Math.pow(10, CODE_LENGTH)
  const n = parseInt(crypto.randomBytes(4).toString('hex'), 16) % max
  return n.toString().padStart(CODE_LENGTH, '0')
}

export function generateVerificationToken() {
  return crypto.randomBytes(32).toString('hex')
}

export function hashPasswordWithSalt(password) {
  const salt = Math.round((new Date().valueOf() * Math.random())) + ''
  const hashed_password = crypto.createHmac('sha1', salt).update(password).digest('hex')
  return { salt, hashed_password }
}

export async function findUserProfileById(id) {
  return User.findById(id).populate('following', '_id name').populate('followers', '_id name').exec()
}
