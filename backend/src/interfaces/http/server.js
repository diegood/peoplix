import Fastify from 'fastify'
import mercurius from 'mercurius'
import cors from '@fastify/cors'
import { resolvers } from '../graphql/resolvers/index.js'
import { schema } from '../graphql/schema.js'

const isDevelopment = process.env.NODE_ENV !== 'production'
const LOG_LEVEL = process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info')
const PORT = process.env.PORT || 3000

export const app = Fastify({
  logger: {
    level: LOG_LEVEL,
    transport: isDevelopment
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            ignore: 'pid,hostname',
            singleLine: false,
          },
        }
      : undefined,
  },
})

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:8080'

await app.register(cors, {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true)
    if (isDevelopment) return cb(null, true)
    const allowed = [FRONTEND_ORIGIN]
    if (allowed.includes(origin)) {
      return cb(null, true)
    }
    cb(new Error('CORS not allowed'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
})

import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET

app.register(mercurius, {
  schema,
  resolvers,
  graphiql: process.env.NODE_ENV !== 'production',
  subscription: true,
  context: (request) => {
    const token = request.headers.authorization || ''
    try {
      if (token) {
        const cleanToken = token.replace('Bearer ', '')
        const decoded = jwt.verify(cleanToken, JWT_SECRET)
        return { user: decoded, pubsub: request.server.graphql.pubsub }
      }
    } catch (e) {
      console.error('Invalid token:', e.message)
      console.error('Token received:', token)
    }
    return { user: null, pubsub: request.server.graphql.pubsub }
  }
})

app.get('/', async function (req, reply) {
  return { ok: 'alive' }
})


export const startServer = async () => {
  console.log('Starting server...')
  console.log('isDevelopment:', isDevelopment)
  console.log('Environment:', process.env.NODE_ENV)
  console.log('Log level:', LOG_LEVEL)
  console.log('Frontend origin:', FRONTEND_ORIGIN)
  try {
    await app.listen({ port: PORT, host: '0.0.0.0' })
    console.log(`Server listening on http://localhost:${PORT}/graphql`)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}
