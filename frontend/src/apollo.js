import { ApolloClient, InMemoryCache, HttpLink, ApolloLink, split } from '@apollo/client/core'
import { provideApolloClient } from '@vue/apollo-composable'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { createClient } from 'graphql-ws'
import { getMainDefinition } from '@apollo/client/utilities'

const httpLink = new HttpLink({
  uri: 'http://localhost:3000/graphql',
})

const wsLink = new GraphQLWsLink(createClient({
  url: 'ws://localhost:3000/graphql',
  connectionParams: () => {
      const token = localStorage.getItem('token')
      return {
          authorization: token ? `Bearer ${token}` : '',
      }
  }
}))

const authMiddleware = new ApolloLink((operation, forward) => {
  const token = localStorage.getItem('token')
  
  operation.setContext(({ headers = {} }) => ({
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    }
  }))

  return forward(operation)
})

const link = split(
  ({ query }) => {
    const definition = getMainDefinition(query)
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    )
  },
  wsLink,
  authMiddleware.concat(httpLink)
)

export const apolloClient = new ApolloClient({
  cache: new InMemoryCache({
    typePolicies: {
      CardComment: {
        fields: {
          reactions: {
            merge(existing, incoming) {
              return incoming
            }
          }
        }
      }
    }
  }),
  link,
})

export function setupApollo() {
  provideApolloClient(apolloClient)
}
