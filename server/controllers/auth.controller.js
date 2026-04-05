import User from '../models/user.model'
import PendingSignup from '../models/pendingSignup.model'
import jwt from 'jsonwebtoken'
import expressJwt from 'express-jwt'
import config from './../../config/config'
import errorHandler from './../helpers/dbErrorHandler'
import { sendVerificationEmail } from '../helpers/email'
import {
  buildPendingSignup,
  ensureEmailNotTaken,
  hashPasswordWithSalt,
  parseVerifyEmailInput,
  persistPendingSignup,
  validateSignupRequest
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
  const validated = validateSignupRequest(req.body)
  if (!validated.ok) {
    return res.status(400).json({ error: validated.error })
  }

  try {
    if (!(await ensureEmailNotTaken(validated.email))) {
      return res.status(400).json({ error: 'Email already exists.' })
    }

    const { salt, hashed_password } = hashPasswordWithSalt(validated.password)
    const pending = buildPendingSignup({
      name: validated.name,
      email: validated.email,
      salt,
      hashed_password
    })
    await persistPendingSignup(validated.email, pending)

    const emailResult = await sendVerificationEmail(pending.email, pending.verificationCode)
    if (!emailResult.success) {
      if (config.env === 'development' && !config.smtpUser) {
        console.log('-----------------------------------------------------------')
        console.log('DEV: Email could not be sent. Use this verification code:', pending.verificationCode)
        console.log('-----------------------------------------------------------')
      } else {
        await pending.remove()
        return res.status(500).json({ error: 'Failed to send verification email. Try again.' })
      }
    }

    return res.status(200).json({
      message: 'Verification code sent to your email.',
      verificationToken: pending.verificationToken
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
  const { verificationToken: rawToken, code: rawCode } = req.body || {}
  if (rawToken === undefined || rawToken === null || rawCode === undefined || rawCode === null) {
    return res.status(400).json({ error: 'Verification token and code are required.' })
  }
  const parsed = parseVerifyEmailInput(rawToken, rawCode)
  if (!parsed) {
    return res.status(400).json({ error: 'Invalid or expired code. Please sign up again.' })
  }

  try {
    const pending = await PendingSignup.findOne({
      verificationToken: parsed.token,
      verificationCode: parsed.code
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
