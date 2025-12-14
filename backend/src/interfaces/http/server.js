import Fastify from 'fastify'
import mercurius from 'mercurius'
import cors from '@fastify/cors'
import { resolvers } from '../graphql/resolvers/index.js'
import { schema } from '../graphql/schema.js'

const app = Fastify()

await app.register(cors, {
  origin: true 
})

app.register(mercurius, {
  schema,
  resolvers,
  graphiql: true
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
