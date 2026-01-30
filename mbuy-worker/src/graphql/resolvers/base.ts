/**
 * Base GraphQL Resolvers
 * Custom scalars and common resolvers
 */

import { GraphQLScalarType, Kind } from 'graphql';
import { GraphQLContext } from '../context';

// DateTime Scalar
const DateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'DateTime custom scalar type',
  serialize(value: unknown): string {
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === 'string') {
      return value;
    }
    throw new Error('DateTime cannot represent invalid value');
  },
  parseValue(value: unknown): Date {
    if (typeof value === 'string' || typeof value === 'number') {
      return new Date(value);
    }
    throw new Error('DateTime cannot represent invalid value');
  },
  parseLiteral(ast): Date | null {
    if (ast.kind === Kind.STRING || ast.kind === Kind.INT) {
      return new Date(ast.kind === Kind.INT ? parseInt(ast.value, 10) : ast.value);
    }
    return null;
  },
});

// JSON Scalar
const JSONScalar = new GraphQLScalarType({
  name: 'JSON',
  description: 'JSON custom scalar type',
  serialize(value: unknown): unknown {
    return value;
  },
  parseValue(value: unknown): unknown {
    return value;
  },
  parseLiteral(ast): unknown {
    switch (ast.kind) {
      case Kind.STRING:
        try {
          return JSON.parse(ast.value);
        } catch {
          return ast.value;
        }
      case Kind.BOOLEAN:
        return ast.value;
      case Kind.INT:
        return parseInt(ast.value, 10);
      case Kind.FLOAT:
        return parseFloat(ast.value);
      case Kind.OBJECT: {
        const value: Record<string, unknown> = {};
        ast.fields.forEach((field) => {
          value[field.name.value] = JSONScalar.parseLiteral(field.value);
        });
        return value;
      }
      case Kind.LIST:
        return ast.values.map((n) => JSONScalar.parseLiteral(n));
      case Kind.NULL:
        return null;
      default:
        return null;
    }
  },
});

// UUID Scalar
const UUIDScalar = new GraphQLScalarType({
  name: 'UUID',
  description: 'UUID custom scalar type',
  serialize(value: unknown): string {
    if (typeof value === 'string') {
      return value;
    }
    throw new Error('UUID cannot represent invalid value');
  },
  parseValue(value: unknown): string {
    if (typeof value === 'string') {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(value)) {
        return value;
      }
    }
    throw new Error('UUID cannot represent invalid value');
  },
  parseLiteral(ast): string | null {
    if (ast.kind === Kind.STRING) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(ast.value)) {
        return ast.value;
      }
    }
    return null;
  },
});

export const baseResolvers = {
  // Custom Scalars
  DateTime: DateTimeScalar,
  JSON: JSONScalar,
  UUID: UUIDScalar,

  // Root Query
  Query: {
    _health: () => 'OK',
  },

  // Root Mutation
  Mutation: {
    _empty: () => null,
  },

  // Root Subscription
  Subscription: {
    _empty: {
      subscribe: () => null,
    },
  },

  // Money Type
  Money: {
    formatted: (parent: { amount: number; currency: string }) => {
      return new Intl.NumberFormat('ar-SA', {
        style: 'currency',
        currency: parent.currency,
      }).format(parent.amount);
    },
  },
};

/**
 * Helper to format money
 */
export function formatMoney(amount: number | string | null, currency: string = 'SAR'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency,
  }).format(num);
}

/**
 * Helper to check authentication
 */
export function requireAuth(ctx: GraphQLContext): void {
  if (!ctx.isAuthenticated) {
    throw new Error('Authentication required');
  }
}

/**
 * Helper to check customer role
 */
export function requireCustomer(ctx: GraphQLContext): void {
  requireAuth(ctx);
  if (!ctx.isCustomer) {
    throw new Error('Customer access required');
  }
}

/**
 * Helper to check merchant role
 */
export function requireMerchant(ctx: GraphQLContext): void {
  requireAuth(ctx);
  if (!ctx.isMerchant) {
    throw new Error('Merchant access required');
  }
}

/**
 * Helper to check admin role
 */
export function requireAdmin(ctx: GraphQLContext): void {
  requireAuth(ctx);
  if (!ctx.isAdmin) {
    throw new Error('Admin access required');
  }
}

/**
 * Pagination helper
 */
export function getPagination(input?: { limit?: number; offset?: number; first?: number; after?: string }) {
  const limit = input?.first || input?.limit || 20;
  const offset = input?.offset || 0;
  
  return { limit: Math.min(limit, 100), offset };
}
