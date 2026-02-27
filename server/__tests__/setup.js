import mongoose from 'mongoose'

const testUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mernproject_test'

beforeAll(async () => {
  await mongoose.connect(testUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
  })
}, 10000)

afterAll(async () => {
  await mongoose.disconnect()
})

afterEach(async () => {
  const collections = mongoose.connection.collections
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({})
  }
})
