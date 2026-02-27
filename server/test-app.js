/**
 * Minimal Express app for API tests. No webpack, no SSR, no devBundle.
 */
import express from 'express'
import bodyParser from 'body-parser'
import userRoutes from './routes/user.routes'
import postRoutes from './routes/post.routes'

const app = express()
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use('/', userRoutes)
app.use('/', postRoutes)

export default app
