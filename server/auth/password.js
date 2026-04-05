import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const BCRYPT_ROUNDS = 10

/** Stored in `salt` when the hash is bcrypt (bcrypt embeds real salt in `hashed_password`). */
export const BCRYPT_SALT_MARKER = 'bcrypt'

export function isBcryptHash(str) {
  return typeof str === 'string' && /^\$2[aby]\$/.test(str)
}

/**
 * New passwords: bcrypt. Marker in `salt` satisfies Mongoose required field; legacy rows keep real HMAC salt.
 */
export function hashPasswordSync(plain) {
  if (!plain) return { hashed_password: '', salt: BCRYPT_SALT_MARKER }
  const hashed_password = bcrypt.hashSync(plain, BCRYPT_ROUNDS)
  return { hashed_password, salt: BCRYPT_SALT_MARKER }
}

/**
 * Verify bcrypt hashes, or legacy SHA-1 HMAC for existing users.
 */
export function verifyPasswordSync(plain, hashed_password, salt) {
  if (!plain || !hashed_password) return false
  if (isBcryptHash(hashed_password)) {
    return bcrypt.compareSync(plain, hashed_password)
  }
  if (!salt || salt === BCRYPT_SALT_MARKER) return false
  try {
    const h = crypto.createHmac('sha1', salt).update(plain).digest('hex')
    return h === hashed_password
  } catch (err) {
    return false
  }
}
