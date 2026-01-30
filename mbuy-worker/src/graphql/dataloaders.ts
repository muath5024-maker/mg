/**
 * DataLoaders for N+1 Problem
 * Batches and caches database queries within a single request
 */

import DataLoader from 'dataloader';
import { eq, inArray } from 'drizzle-orm';
import { Database } from '../db';
import * as schema from '../db/schema';

export interface DataLoaders {
  // Users
  customerLoader: DataLoader<string, schema.Customer | null>;
  
  // Merchants
  merchantLoader: DataLoader<string, schema.Merchant | null>;
  merchantUserLoader: DataLoader<string, schema.MerchantUser | null>;
  
  // Products
  productLoader: DataLoader<string, schema.Product | null>;
  productVariantLoader: DataLoader<string, schema.ProductVariant | null>;
  productsByMerchantLoader: DataLoader<string, schema.Product[]>;
  
  // Categories
  categoryLoader: DataLoader<string, schema.Category | null>;
  
  // Orders
  orderLoader: DataLoader<string, schema.Order | null>;
  orderItemsLoader: DataLoader<string, schema.OrderItem[]>;
}

/**
 * Create all DataLoaders for a request
 */
export function createDataLoaders(db: Database): DataLoaders {
  return {
    // Customer loader
    customerLoader: new DataLoader(async (ids) => {
      const customers = await db
        .select()
        .from(schema.customers)
        .where(inArray(schema.customers.id, ids as string[]));
      
      const customerMap = new Map(customers.map(c => [c.id, c]));
      return ids.map(id => customerMap.get(id) || null);
    }),

    // Merchant loader
    merchantLoader: new DataLoader(async (ids) => {
      const merchants = await db
        .select()
        .from(schema.merchants)
        .where(inArray(schema.merchants.id, ids as string[]));
      
      const merchantMap = new Map(merchants.map(m => [m.id, m]));
      return ids.map(id => merchantMap.get(id) || null);
    }),

    // Merchant User loader
    merchantUserLoader: new DataLoader(async (ids) => {
      const users = await db
        .select()
        .from(schema.merchantUsers)
        .where(inArray(schema.merchantUsers.id, ids as string[]));
      
      const userMap = new Map(users.map(u => [u.id, u]));
      return ids.map(id => userMap.get(id) || null);
    }),

    // Product loader
    productLoader: new DataLoader(async (ids) => {
      const products = await db
        .select()
        .from(schema.products)
        .where(inArray(schema.products.id, ids as string[]));
      
      const productMap = new Map(products.map(p => [p.id, p]));
      return ids.map(id => productMap.get(id) || null);
    }),

    // Product variant loader
    productVariantLoader: new DataLoader(async (ids) => {
      const variants = await db
        .select()
        .from(schema.productVariants)
        .where(inArray(schema.productVariants.id, ids as string[]));
      
      const variantMap = new Map(variants.map(v => [v.id, v]));
      return ids.map(id => variantMap.get(id) || null);
    }),

    // Products by merchant loader
    productsByMerchantLoader: new DataLoader(async (merchantIds) => {
      const products = await db
        .select()
        .from(schema.products)
        .where(inArray(schema.products.merchantId, merchantIds as string[]));
      
      const productsByMerchant = new Map<string, schema.Product[]>();
      for (const product of products) {
        const existing = productsByMerchant.get(product.merchantId) || [];
        existing.push(product);
        productsByMerchant.set(product.merchantId, existing);
      }
      
      return merchantIds.map(id => productsByMerchant.get(id) || []);
    }),

    // Category loader
    categoryLoader: new DataLoader(async (ids) => {
      const categories = await db
        .select()
        .from(schema.categories)
        .where(inArray(schema.categories.id, ids as string[]));
      
      const categoryMap = new Map(categories.map(c => [c.id, c]));
      return ids.map(id => categoryMap.get(id) || null);
    }),

    // Order loader
    orderLoader: new DataLoader(async (ids) => {
      const orders = await db
        .select()
        .from(schema.orders)
        .where(inArray(schema.orders.id, ids as string[]));
      
      const orderMap = new Map(orders.map(o => [o.id, o]));
      return ids.map(id => orderMap.get(id) || null);
    }),

    // Order items loader
    orderItemsLoader: new DataLoader(async (orderIds) => {
      const items = await db
        .select()
        .from(schema.orderItems)
        .where(inArray(schema.orderItems.orderId, orderIds as string[]));
      
      const itemsByOrder = new Map<string, schema.OrderItem[]>();
      for (const item of items) {
        const existing = itemsByOrder.get(item.orderId) || [];
        existing.push(item);
        itemsByOrder.set(item.orderId, existing);
      }
      
      return orderIds.map(id => itemsByOrder.get(id) || []);
    }),
  };
}
