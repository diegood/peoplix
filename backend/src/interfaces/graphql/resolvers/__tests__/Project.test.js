
import { describe, it, expect } from 'vitest'
import Fastify from 'fastify'
import mercurius from 'mercurius'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { authDirectiveTransformer } from '../../directives/auth.directive.js'
import { ProjectSchema } from '../../typedefs/Project.js'
import { defaultFieldResolver } from 'graphql'

// Mock services
const mockService = {
  getAll: () => [],
  getById: () => ({ id: '1', name: 'Test P' }),
  create: () => ({ id: '1', name: 'New P' }),
  update: () => ({ id: '1', name: 'Upd P' }),
  delete: () => true,
  addRequirement: () => ({}),
  updateRequirement: () => ({}),
  removeRequirement: () => true,
  addRequirementSkill: () => ({}),
  removeRequirementSkill: () => true
}

const mockWpService = { getByProject: () => [] }

// We need a minimal schema to make ProjectSchema valid (it extends Query/Mutation)
const baseParams = `
  directive @auth(requires: AuthRole = ADMIN, sameUser: String) on OBJECT | FIELD_DEFINITION
  enum AuthRole { ADMIN, USER, SUPER_ADMIN }
  scalar JSON
  type Query { _empty: String }
  type Mutation { _empty: String }
  type Organization { id: ID }
  type Allocation { id: ID }
  type Sprint { id: ID }
  type Milestone { id: ID }
  type WorkPackage { id: ID }
  type FunctionalRequirement { id: ID }
  enum Role { DEV }
  enum Skill { JS } 
`

// Simple resolvers to support the schema
const resolvers = {
    Query: {
        projects: () => mockService.getAll(),
        project: () => mockService.getById()
    },
    Mutation: {
        createProject: () => mockService.create(),
        updateProject: () => mockService.update(),
        deleteProject: () => mockService.delete(),
        addProjectRequirement: () => mockService.addRequirement(),
        updateProjectRequirement: () => mockService.updateRequirement(),
        removeProjectRequirement: () => mockService.removeRequirement(),
        addRequirementSkill: () => mockService.addRequirementSkill(),
        removeRequirementSkill: () => mockService.removeRequirementSkill()
    },
    Project: {
        workPackages: () => [],
        functionalRequirements: () => []
    }
}

describe('Project Auth', () => {
    const createTestApp = async (user) => {
        const app = Fastify()
        
        // Combine schemas
        const typeDefs = [baseParams, ProjectSchema]
        
        let schema = makeExecutableSchema({ typeDefs, resolvers })
        schema = authDirectiveTransformer(schema, 'auth')

        app.register(mercurius, {
            schema,
            context: () => ({ user }) 
        })
        return app
    }

    it('should allow USER to query projects', async () => {
        const app = await createTestApp({ id: 'u1', role: 2 }) // User
        const query = '{ projects { id } }'
        
        const response = await app.inject({
            method: 'POST',
            url: '/graphql',
            payload: { query }
        })
        
        const result = JSON.parse(response.payload)
        expect(result.errors).toBeUndefined()
    })

    it('should block USER from creating project (ADMIN only)', async () => {
        const app = await createTestApp({ id: 'u1', role: 2 })
        const query = 'mutation { createProject(name: "X", contractedHours: 10) { id } }'
        
        const response = await app.inject({
            method: 'POST',
            url: '/graphql',
            payload: { query }
        })
        
        const result = JSON.parse(response.payload)
        expect(result.errors).toBeDefined()
        expect(result.errors[0].message).toContain('Admin access required')
    })

    it('should allow ADMIN to verify project access', async () => {
         const app = await createTestApp({ id: 'a1', role: 1 }) // Admin
         const query = 'mutation { createProject(name: "X", contractedHours: 10) { id } }'
         
         const response = await app.inject({
             method: 'POST',
             url: '/graphql',
             payload: { query }
         })
         
         const result = JSON.parse(response.payload)
         expect(result.errors).toBeUndefined()
    })
})
