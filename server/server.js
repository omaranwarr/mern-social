import config from './../config/config'
import app from './express'
import mongoose from 'mongoose'

// Connection URL
mongoose.Promise = global.Promise
mongoose.connect(config.mongoUri, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true, useFindAndModify: false })
mongoose.connection.on('error', () => {
  throw new Error(`unable to connect to database: ${config.mongoUri}`)
})

app.listen(config.port, (err) => {
  if (err) {
    console.log(err)
  }
  console.info('Server started on port %s.', config.port)
  if (config.smtpUser && config.smtpHost) {
    console.info('Email: using SMTP (%s) – verification emails will be sent to users.', config.smtpHost)
  } else {
    console.info('Email: using Ethereal (test inbox). To send real emails, add SMTP_HOST, SMTP_USER, SMTP_PASS to a .env file in the project root and restart.')
  }
})
