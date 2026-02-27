import User from '../models/user.model'
import PendingSignup from '../models/pendingSignup.model'
import extend from 'lodash/extend'
import errorHandler from './../helpers/dbErrorHandler'
import formidable from 'formidable'
import fs from 'fs'
import crypto from 'crypto'
import config from '../../config/config'
import profileImage from './../../client/assets/images/profile-pic.png'
import { sendVerificationEmail } from '../helpers/email'

const CODE_EXPIRY_MINUTES = 10
const CODE_LENGTH = 6

function generateCode() {
  const max = Math.pow(10, CODE_LENGTH)
  const n = parseInt(crypto.randomBytes(4).toString('hex'), 16) % max
  return n.toString().padStart(CODE_LENGTH, '0')
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex')
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

    const salt = Math.round((new Date().valueOf() * Math.random())) + ''
    const hashed_password = crypto.createHmac('sha1', salt).update(password).digest('hex')
    const verificationCode = generateCode()
    const verificationToken = generateToken()
    const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000)

    await PendingSignup.deleteMany({ email: email.trim().toLowerCase() })

    const pending = new PendingSignup({
      name: name.trim(),
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
      // In development without SMTP: log code to console so user can still complete signup
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
    // Satisfy User model validator that requires password on new docs; we already have hashed_password/salt
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

/**
 * Load user and append to req.
 */
const userByID = async (req, res, next, id) => {
  try {
    let user = await User.findById(id).populate('following', '_id name')
    .populate('followers', '_id name')
    .exec()
    if (!user)
      return res.status('400').json({
        error: "User not found"
      })
    req.profile = user
    next()
  } catch (err) {
    return res.status('400').json({
      error: "Could not retrieve user"
    })
  }
}

const read = (req, res) => {
  req.profile.hashed_password = undefined
  req.profile.salt = undefined
  return res.json(req.profile)
}

const list = async (req, res) => {
  try {
    let users = await User.find().select('name email updated created')
    res.json(users)
  } catch (err) {
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}

const update = (req, res) => {
  let form = new formidable.IncomingForm()
  form.keepExtensions = true
  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(400).json({
        error: "Photo could not be uploaded"
      })
    }
    let user = req.profile
    user = extend(user, fields)
    user.updated = Date.now()
    if(files.photo){
      user.photo.data = fs.readFileSync(files.photo.path)
      user.photo.contentType = files.photo.type
    }
    try {
      await user.save()
      user.hashed_password = undefined
      user.salt = undefined
      res.json(user)
    } catch (err) {
      return res.status(400).json({
        error: errorHandler.getErrorMessage(err)
      })
    }
  })
}

const remove = async (req, res) => {
  try {
    let user = req.profile
    let deletedUser = await user.remove()
    deletedUser.hashed_password = undefined
    deletedUser.salt = undefined
    res.json(deletedUser)
  } catch (err) {
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}

const photo = (req, res, next) => {
  if(req.profile.photo.data){
    res.set("Content-Type", req.profile.photo.contentType)
    return res.send(req.profile.photo.data)
  }
  next()
}

const defaultPhoto = (req, res) => {
  return res.sendFile(process.cwd()+profileImage)
}

const addFollowing = async (req, res, next) => {
  try{
    await User.findByIdAndUpdate(req.body.userId, {$push: {following: req.body.followId}}) 
    next()
  }catch(err){
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}

const addFollower = async (req, res) => {
  try{
    let result = await User.findByIdAndUpdate(req.body.followId, {$push: {followers: req.body.userId}}, {new: true})
                            .populate('following', '_id name')
                            .populate('followers', '_id name')
                            .exec()
      result.hashed_password = undefined
      result.salt = undefined
      res.json(result)
    }catch(err) {
      return res.status(400).json({
        error: errorHandler.getErrorMessage(err)
      })
    }  
}

const removeFollowing = async (req, res, next) => {
  try{
    await User.findByIdAndUpdate(req.body.userId, {$pull: {following: req.body.unfollowId}}) 
    next()
  }catch(err) {
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}
const removeFollower = async (req, res) => {
  try{
    let result = await User.findByIdAndUpdate(req.body.unfollowId, {$pull: {followers: req.body.userId}}, {new: true})
                            .populate('following', '_id name')
                            .populate('followers', '_id name')
                            .exec() 
    result.hashed_password = undefined
    result.salt = undefined
    res.json(result)
  }catch(err){
      return res.status(400).json({
        error: errorHandler.getErrorMessage(err)
      })
  }
}

const findPeople = async (req, res) => {
  let following = req.profile.following
  following.push(req.profile._id)
  try {
    let users = await User.find({ _id: { $nin : following } }).select('name')
    res.json(users)
  }catch(err){
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}

export default {
  create,
  signupRequest,
  verifyEmailAndSignup,
  userByID,
  read,
  list,
  remove,
  update,
  photo,
  defaultPhoto,
  addFollowing,
  addFollower,
  removeFollowing,
  removeFollower,
  findPeople
}
