import { projectResolver } from './project.resolver.js'
import { collaboratorResolver } from './collaborator.resolver.js'
import { allocationResolver } from './allocation.resolver.js'
import { configurationResolver } from './configuration.resolver.js'
import { workCenterResolver } from './workCenter.resolver.js'

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
    return merged
}

export const resolvers = mergeResolvers([
    projectResolver,
    collaboratorResolver,
    allocationResolver,
    configurationResolver,
    workCenterResolver
])
