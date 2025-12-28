import { ApolloClient, InMemoryCache, HttpLink, ApolloLink } from '@apollo/client/core'
import { provideApolloClient } from '@vue/apollo-composable'

const httpLink = new HttpLink({
  uri: 'http://localhost:3000/graphql',
})

const authMiddleware = new ApolloLink((operation, forward) => {
  // get the authentication token from local storage if it exists
  const token = localStorage.getItem('token')
  
  // return the headers to the context so httpLink can read them
  operation.setContext(({ headers = {} }) => ({
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    }
  }))

  return forward(operation)
})

export const apolloClient = new ApolloClient({
  cache: new InMemoryCache(),
  link: authMiddleware.concat(httpLink),
})

export function setupApollo() {
  provideApolloClient(apolloClient)
}
