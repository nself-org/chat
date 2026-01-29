import { ApolloClient, InMemoryCache, createHttpLink, split } from '@apollo/client'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { getMainDefinition } from '@apollo/client/utilities'
import { createClient } from 'graphql-ws'
import { setContext } from '@apollo/client/link/context'

const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL || 'http://localhost:1337/v1/graphql',
})

const wsLink = typeof window !== 'undefined' 
  ? new GraphQLWsLink(
      createClient({
        url: (process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL || 'http://localhost:1337/v1/graphql').replace('http', 'ws'),
      })
    )
  : null

const authLink = setContext((_, { headers }) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    }
  }
})

const splitLink = wsLink 
  ? split(
      ({ query }) => {
        const definition = getMainDefinition(query)
        return (
          definition.kind === 'OperationDefinition' &&
          definition.operation === 'subscription'
        )
      },
      wsLink,
      authLink.concat(httpLink)
    )
  : authLink.concat(httpLink)

export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
})