import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client/core'
import { provideApolloClient } from '@vue/apollo-composable'

// Create the apollo client
const cache = new InMemoryCache()

const httpLink = new HttpLink({
  uri: 'http://localhost:3000/graphql',
})

export const apolloClient = new ApolloClient({
  cache,
  link: httpLink,
})

export function setupApollo() {
  provideApolloClient(apolloClient)
}
