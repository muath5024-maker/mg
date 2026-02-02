/**
 * GraphQL Resolvers Index
 * Combines all resolvers
 */

import { baseResolvers } from './base';
import { userResolvers } from './user';
import { merchantResolvers } from './merchant';
import { productResolvers } from './product';
import { categoryResolvers } from './category';
import { orderResolvers } from './order';
import { cartResolvers } from './cart';
import { mergeResolvers } from '@graphql-tools/merge';

export const resolvers = mergeResolvers([
  baseResolvers,
  userResolvers,
  merchantResolvers,
  productResolvers,
  categoryResolvers,
  orderResolvers,
  cartResolvers,
]);
