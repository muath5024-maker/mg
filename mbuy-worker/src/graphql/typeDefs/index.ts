/**
 * GraphQL Type Definitions Index
 * Combines all type definitions
 */

import { baseTypeDefs } from './base';
import { userTypeDefs } from './user';
import { merchantTypeDefs } from './merchant';
import { productTypeDefs } from './product';
import { categoryTypeDefs } from './category';
import { orderTypeDefs } from './order';
import { cartTypeDefs } from './cart';

export const typeDefs = [
  baseTypeDefs,
  userTypeDefs,
  merchantTypeDefs,
  productTypeDefs,
  categoryTypeDefs,
  orderTypeDefs,
  cartTypeDefs,
];
