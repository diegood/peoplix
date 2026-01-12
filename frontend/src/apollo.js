import { ApolloClient, InMemoryCache, HttpLink, ApolloLink, split } from '@apollo/client/core'
import { provideApolloClient } from '@vue/apollo-composable'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { createClient } from 'graphql-ws'
import { getMainDefinition } from '@apollo/client/utilities'

const runtimeConfig = typeof window !== 'undefined' ? (window.__APP_CONFIG__ || {}) : {}
const rawHttp = runtimeConfig.API_HTTP_URL || import.meta.env?.VITE_API_HTTP_URL || getDefaultHttpUrl()
const rawWs = runtimeConfig.API_WS_URL || import.meta.env?.VITE_API_WS_URL

function getDefaultHttpUrl () {
  if (typeof window === 'undefined') return 'http://localhost:3000/graphql'
  const host = window.location.hostname
  const isLocal =
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '0.0.0.0' ||
    host === '[::1]' ||
    host.endsWith('.local')
  if (isLocal) return 'http://localhost:3000/graphql'
  if (host.endsWith('.eu')) return 'https://api.peoplix.eu/graphql'
  if (host.endsWith('.app')) return 'https://api.peoplix.eu/graphql'
  if (host.endsWith('.es')) return 'https://api.peoplix.es/graphql'
  return 'https://api.peoplix.es/graphql'
}

const toAbsoluteHttp = (url) => {
  if (!url) return null
  if (url.startsWith('http')) return url
  if (typeof window !== 'undefined' && url.startsWith('/')) return `${window.location.origin}${url}`
  return url
}

const deriveWsFromHttp = (httpUrl) => {
  if (!httpUrl) return null
  try {
    const u = new URL(httpUrl)
    u.protocol = u.protocol === 'https:' ? 'wss:' : 'ws:'
    return u.toString()
  } catch {
    if (typeof window !== 'undefined') {
      const isHttps = window.location.protocol === 'https:'
      const path = httpUrl.startsWith('/') ? httpUrl : `/${httpUrl}`
      return `${isHttps ? 'wss' : 'ws'}://${window.location.host}${path}`
    }
    return httpUrl
  }
}

const HTTP_URL = toAbsoluteHttp(rawHttp)
const WS_URL = rawWs && rawWs.startsWith('ws') ? rawWs : deriveWsFromHttp(HTTP_URL)

const httpLink = new HttpLink({
  uri: HTTP_URL,
})

const wsLink = new GraphQLWsLink(createClient({
  url: WS_URL,
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
      },
      KanbanCard: {
        fields: {
          comments: {
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
