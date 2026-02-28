import mongoose from 'mongoose'
const PostSchema = new mongoose.Schema({
  text: {
    type: String,
    default: ''
  },
  photo: {
    data: Buffer,
    contentType: String
  },
  likes: [{type: mongoose.Schema.ObjectId, ref: 'User'}],
  comments: [{
    text: String,
    created: { type: Date, default: Date.now },
    postedBy: { type: mongoose.Schema.ObjectId, ref: 'User'}
  }],
  postedBy: {type: mongoose.Schema.ObjectId, ref: 'User'},
  created: {
    type: Date,
    default: Date.now
  }
})

// Post must have either text (caption) or photo; caption-less image posts are allowed
PostSchema.pre('save', function (next) {
  const hasText = this.text && this.text.trim().length > 0
  const hasPhoto = this.photo && this.photo.data && this.photo.data.length > 0
  if (!hasText && !hasPhoto) {
    next(new Error('Post must have text or a photo'))
  } else {
    next()
  }
})

export default mongoose.model('Post', PostSchema)
