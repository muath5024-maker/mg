/**
 * GraphQL Server Setup
 * Main entry point for GraphQL Yoga server
 */

import { createYoga, YogaInitialContext } from 'graphql-yoga';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { typeDefs } from './typeDefs';
import { resolvers } from './resolvers';
import { createContext, GraphQLContext } from './context';
import { Env } from '../types';

/**
 * Create GraphQL Yoga instance
 */
export function createGraphQLHandler(env: Env) {
  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  const yoga = createYoga<Env, GraphQLContext>({
    schema,
    context: (ctx: YogaInitialContext) => createContext(ctx, env),
    graphiql: {
      title: 'MBuy GraphQL API',
      defaultQuery: `# Welcome to MBuy GraphQL API
# Try a simple query:
query {
  me {
    id
    fullName
    phone
  }
}`,
    },
    // CORS is handled by Hono
    cors: false,
    // Enable introspection in development
    maskedErrors: process.env.NODE_ENV === 'production',
    // Logging
    logging: {
      debug: (...args) => console.log('[GraphQL Debug]', ...args),
      info: (...args) => console.log('[GraphQL Info]', ...args),
      warn: (...args) => console.warn('[GraphQL Warn]', ...args),
      error: (...args) => console.error('[GraphQL Error]', ...args),
    },
  });

  return yoga;
}

export { GraphQLContext } from './context';
