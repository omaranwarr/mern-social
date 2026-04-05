import mongoose from 'mongoose'

const PendingSignupSchema = new mongoose.Schema({
  name: { type: String, trim: true, required: true },
  email: { type: String, trim: true, required: true },
  hashed_password: { type: String, required: true },
  salt: { type: String, required: true },
  verificationCode: { type: String, required: true },
  verificationToken: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  created: { type: Date, default: Date.now }
})

export default mongoose.model('PendingSignup', PendingSignupSchema)
