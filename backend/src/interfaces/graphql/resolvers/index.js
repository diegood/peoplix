import { projectResolver } from './project.resolver.js'
import { collaboratorResolver } from './collaborator.resolver.js'
import { allocationResolver } from './allocation.resolver.js'
import { configurationResolver } from './configuration.resolver.js'
import { workCenterResolver } from './workCenter.resolver.js'
import { absenceResolver } from './absence.resolver.js'
import { workPackageResolvers } from './workPackage.resolver.js'
import { authResolvers } from './Auth.js'
import GraphQLJSON from 'graphql-type-json';

const mergeResolvers = (resolvers) => {
    const merged = { Query: {}, Mutation: {} }
    resolvers.forEach(r => {
        if (r.Query) Object.assign(merged.Query, r.Query)
        if (r.Mutation) Object.assign(merged.Mutation, r.Mutation)
        Object.keys(r).forEach(key => {
            if (key !== 'Query' && key !== 'Mutation') {
                merged[key] = { ...merged[key], ...r[key] }
            }
        })
    })
    merged.JSON = GraphQLJSON; // Add JSON Scalar resolver
    return merged
}

export const resolvers = mergeResolvers([
    projectResolver,
    collaboratorResolver,
    allocationResolver,
    configurationResolver,
    workCenterResolver,
    absenceResolver,
    workPackageResolvers,
    authResolvers
])
