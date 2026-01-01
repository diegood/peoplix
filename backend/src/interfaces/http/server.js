import Fastify from 'fastify'
import mercurius from 'mercurius'
import cors from '@fastify/cors'
import { resolvers } from '../graphql/resolvers/index.js'
import { schema } from '../graphql/schema.js'

export const app = Fastify()

await app.register(cors, {
  origin: true 
})

import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey'

app.register(mercurius, {
  schema,
  resolvers,
  graphiql: true,
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
  return { hello: 'hola :)' }
})


export const startServer = async () => {
  try {
    await app.listen({ port: 3000, host: '0.0.0.0' })
    console.log('Server listening on http://localhost:3000/graphql')
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}
