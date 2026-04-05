import crypto from 'crypto'
import User from '../models/user.model'
import PendingSignup from '../models/pendingSignup.model'
import { sanitizeString } from '../helpers/sanitize'

export const CODE_EXPIRY_MINUTES = 10
export const CODE_LENGTH = 6

/**
 * @returns {{ ok: true, name: string, email: string, password: string } | { ok: false, error: string }}
 */
export function validateSignupRequest(body) {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Name, email and password are required.' }
  }
  const { name, email, password } = body
  if (!name || !email || !password) {
    return { ok: false, error: 'Name, email and password are required.' }
  }
  const nameTrim = String(name).trim()
  const emailTrim = String(email).trim().toLowerCase()
  if (!nameTrim || !emailTrim) {
    return { ok: false, error: 'Name, email and password are required.' }
  }
  return { ok: true, name: nameTrim, email: emailTrim, password: String(password) }
}

export async function ensureEmailNotTaken(emailLower) {
  const existing = await User.findOne({ email: emailLower })
  return existing === null
}

export function buildPendingSignup({ name, email, salt, hashed_password }) {
  const verificationCode = generateVerificationCode()
  const verificationToken = generateVerificationToken()
  const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000)
  return new PendingSignup({
    name: sanitizeString(name),
    email,
    hashed_password,
    salt,
    verificationCode,
    verificationToken,
    expiresAt
  })
}

export async function persistPendingSignup(normalizedEmail, pendingDoc) {
  await PendingSignup.deleteMany({ email: normalizedEmail })
  await pendingDoc.save()
}

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
