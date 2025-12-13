import Fastify from 'fastify'
import cors from '@fastify/cors'
import mercurius from 'mercurius'

console.log('Imports successful')
const app = Fastify()
await app.register(cors)
await app.register(mercurius, { schema: 'type Query { hello: String }', resolvers: { Query: { hello: () => 'world' } } })
console.log('Register successful')
