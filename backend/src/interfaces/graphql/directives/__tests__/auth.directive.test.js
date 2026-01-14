
import { describe, it, expect, vi } from 'vitest'
import Fastify from 'fastify'
import mercurius from 'mercurius'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { authDirectiveTransformer } from '../auth.directive.js'

describe('Auth Directive', () => {
    // Define a minimal test schema using the directive
    const typeDefs = `
        directive @auth(requires: AuthRole = ADMIN, sameUser: String) on OBJECT | FIELD_DEFINITION

        enum AuthRole {
            ADMIN
            USER
            SUPER_ADMIN
        }

        type Query {
            adminOnly: String @auth(requires: ADMIN)
            userOnly: String @auth(requires: USER)
            superAdminOnly: String @auth(requires: SUPER_ADMIN)
            selfOnly(id: ID!): String @auth(requires: ADMIN, sameUser: "id")
            collaboratorOnly(collaboratorId: ID!): String @auth(requires: ADMIN, sameUser: "collaboratorId")
            public: String
        }
    `

    const resolvers = {
        Query: {
            adminOnly: () => 'admin data',
            userOnly: () => 'user data',
            superAdminOnly: () => 'super admin data',
            selfOnly: () => 'self data',
            collaboratorOnly: () => 'collaborator data',
            public: () => 'public data'
        }
    }

    // Helper to create app
    const createTestApp = async (context) => {
        const app = Fastify()
        
        let schema = makeExecutableSchema({ typeDefs, resolvers })
        schema = authDirectiveTransformer(schema, 'auth')

        app.register(mercurius, {
            schema,
            context: () => context // Static context for testing
        })

        return app
    }

    it('should block unauthenticated users', async () => {
        const app = await createTestApp({ user: null })
        const query = '{ userOnly }'
        
        const response = await app.inject({
            method: 'POST',
            url: '/graphql',
            payload: { query }
        })
        
        const result = JSON.parse(response.payload)
        expect(result.errors).toBeDefined()
        expect(result.errors[0].message).toContain('Unauthorized')
    })

    it('should allow authenticated users to access USER fields', async () => {
        const app = await createTestApp({ user: { id: 'u1', role: 2 } })
        const query = '{ userOnly }'
        
        const response = await app.inject({
            method: 'POST',
            url: '/graphql',
            payload: { query }
        })

        const result = JSON.parse(response.payload)
        expect(result.errors).toBeUndefined()
        expect(result.data.userOnly).toBe('user data')
    })

    it('should block regular users from accessing ADMIN fields', async () => {
        const app = await createTestApp({ user: { id: 'u1', role: 2 } })
        const query = '{ adminOnly }'
        
        const response = await app.inject({
            method: 'POST',
            url: '/graphql',
            payload: { query }
        })

        const result = JSON.parse(response.payload)
        expect(result.errors).toBeDefined()
        expect(result.errors[0].message).toContain('Admin access required')
    })

    it('should allow ADMIN users (role <= 1) to access ADMIN fields', async () => {
        const app = await createTestApp({ user: { id: 'a1', role: 1 } })
        const query = '{ adminOnly }'
        
        const response = await app.inject({
            method: 'POST',
            url: '/graphql',
            payload: { query }
        })

        const result = JSON.parse(response.payload)
        expect(result.errors).toBeUndefined()
        expect(result.data.adminOnly).toBe('admin data')
    })

    it('should allow SuperAdmin to access ADMIN fields', async () => {
        const app = await createTestApp({ user: { id: 'sa', isSuperAdmin: true } })
        const query = '{ adminOnly }'
        
        const response = await app.inject({
            method: 'POST',
            url: '/graphql',
            payload: { query }
        })

        const result = JSON.parse(response.payload)
        expect(result.errors).toBeUndefined()
        expect(result.data.adminOnly).toBe('admin data')
    })

    it('should allow regular user to access own data via sameUser="id"', async () => {
        const app = await createTestApp({ user: { id: 'u1', role: 2 } })
        const query = '{ selfOnly(id: "u1") }'
        
        const response = await app.inject({
            method: 'POST',
            url: '/graphql',
            payload: { query }
        })

        const result = JSON.parse(response.payload)
        expect(result.errors).toBeUndefined()
        expect(result.data.selfOnly).toBe('self data')
    })

    it('should block regular user from accessing other data via sameUser="id"', async () => {
        const app = await createTestApp({ user: { id: 'u1', role: 2 } })
        const query = '{ selfOnly(id: "u2") }'
        
        const response = await app.inject({
            method: 'POST',
            url: '/graphql',
            payload: { query }
        })

        const result = JSON.parse(response.payload)
        expect(result.errors).toBeDefined()
        expect(result.errors[0].message).toContain('Admin access required')
    })

    it('should allow regular user to access data via sameUser="collaboratorId"', async () => {
        const app = await createTestApp({ user: { id: 'u1', role: 2 } })
        const query = '{ collaboratorOnly(collaboratorId: "u1") }'
        
        const response = await app.inject({
            method: 'POST',
            url: '/graphql',
            payload: { query }
        })

        const result = JSON.parse(response.payload)
        expect(result.errors).toBeUndefined()
        expect(result.data.collaboratorOnly).toBe('collaborator data')
    })

    it('should block ADMIN from accessing SUPER_ADMIN fields', async () => {
        const app = await createTestApp({ user: { id: 'a1', role: 1 } })
        const query = '{ superAdminOnly }'
        
        const response = await app.inject({
            method: 'POST',
            url: '/graphql',
            payload: { query }
        })

        const result = JSON.parse(response.payload)
        expect(result.errors).toBeDefined()
        expect(result.errors[0].message).toContain('Super Admin access required')
    })

    it('should allow SuperAdmin to access SUPER_ADMIN fields', async () => {
        const app = await createTestApp({ user: { id: 'sa', isSuperAdmin: true } })
        const query = '{ superAdminOnly }'
        
        const response = await app.inject({
            method: 'POST',
            url: '/graphql',
            payload: { query }
        })

        const result = JSON.parse(response.payload)
        expect(result.errors).toBeUndefined()
        expect(result.data.superAdminOnly).toBe('super admin data')
    })
})
