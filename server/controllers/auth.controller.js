import User from '../models/user.model'
import PendingSignup from '../models/pendingSignup.model'
import jwt from 'jsonwebtoken'
import expressJwt from 'express-jwt'
import config from './../../config/config'
import errorHandler from './../helpers/dbErrorHandler'
import { sanitizeString } from './../helpers/sanitize'
import { sendVerificationEmail } from '../helpers/email'
import {
  CODE_EXPIRY_MINUTES,
  generateVerificationCode,
  generateVerificationToken,
  hashPasswordWithSalt
} from '../services/user.service'

const signin = async (req, res) => {
  try {
    let user = await User.findOne({
      "email": req.body.email
    })

    if (!user)
      return res.status('401').json({
        error: "User not found"
      })

    if (!user.authenticate(req.body.password)) {
      return res.status('401').send({
        error: "Email and password don't match."
      })
    }

    const token = jwt.sign({
      _id: user._id
    }, config.jwtSecret)

    res.cookie("t", token, {
      expire: new Date() + 9999
    })

    return res.json({
      token,
      user: {_id: user._id, name: user.name, email: user.email}
    })
  } catch (err) {
    console.log(err)
    return res.status('401').json({
      error: "Could not sign in"
    })

  }
}

const signout = (req, res) => {
  res.clearCookie("t")
  return res.status('200').json({
    message: "signed out"
  })
}

const requireSignin = expressJwt({
  secret: config.jwtSecret,
  userProperty: 'auth'
})

const hasAuthorization = (req, res, next) => {
  const authorized = req.profile && req.auth && req.profile._id == req.auth._id
  if (!(authorized)) {
    return res.status('403').json({
      error: "User is not authorized"
    })
  }
  next()
}

/**
 * Request signup: create pending signup, send 2FA code to email, return verification token.
 */
const signupRequest = async (req, res) => {
  const { name, email, password } = req.body || {}
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required.' })
  }

  try {
    const existing = await User.findOne({ email: email.trim().toLowerCase() })
    if (existing) {
      return res.status(400).json({ error: 'Email already exists.' })
    }

    const { salt, hashed_password } = hashPasswordWithSalt(password)
    const verificationCode = generateVerificationCode()
    const verificationToken = generateVerificationToken()
    const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000)

    await PendingSignup.deleteMany({ email: email.trim().toLowerCase() })

    const pending = new PendingSignup({
      name: sanitizeString(name.trim()),
      email: email.trim().toLowerCase(),
      hashed_password,
      salt,
      verificationCode,
      verificationToken,
      expiresAt
    })
    await pending.save()

    const emailResult = await sendVerificationEmail(pending.email, verificationCode)
    if (!emailResult.success) {
      if (config.env === 'development' && !config.smtpUser) {
        console.log('-----------------------------------------------------------')
        console.log('DEV: Email could not be sent. Use this verification code:', verificationCode)
        console.log('-----------------------------------------------------------')
      } else {
        await pending.remove()
        return res.status(500).json({ error: 'Failed to send verification email. Try again.' })
      }
    }

    return res.status(200).json({
      message: 'Verification code sent to your email.',
      verificationToken
    })
  } catch (err) {
    console.error('Signup error:', err)
    const message = errorHandler.getErrorMessage(err) || err.message || 'Something went wrong.'
    return res.status(400).json({ error: message })
  }
}

/**
 * Verify email with code and complete signup (create user).
 */
const verifyEmailAndSignup = async (req, res) => {
  const { verificationToken, code } = req.body || {}
  if (!verificationToken || !code) {
    return res.status(400).json({ error: 'Verification token and code are required.' })
  }

  try {
    const pending = await PendingSignup.findOne({
      verificationToken,
      verificationCode: code.trim()
    })
    if (!pending) {
      return res.status(400).json({ error: 'Invalid or expired code. Please sign up again.' })
    }
    if (new Date() > pending.expiresAt) {
      await pending.remove()
      return res.status(400).json({ error: 'Code expired. Please sign up again.' })
    }

    const user = new User({
      name: pending.name,
      email: pending.email,
      hashed_password: pending.hashed_password,
      salt: pending.salt
    })
    user._password = '[verified]'
    await user.save()
    await pending.remove()

    return res.status(200).json({
      message: 'Successfully signed up! You can sign in now.'
    })
  } catch (err) {
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}

const create = async (req, res) => {
  const user = new User(req.body)
  try {
    await user.save()
    return res.status(200).json({
      message: "Successfully signed up!"
    })
  } catch (err) {
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}

export default {
  signin,
  signout,
  requireSignin,
  hasAuthorization,
  signupRequest,
  verifyEmailAndSignup,
  create
}
