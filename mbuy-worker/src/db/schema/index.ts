/**
 * Drizzle Schema Index
 * Exports all table schemas
 * 
 * Note: Order matters due to circular imports
 */

// Core Tables - ordered by dependency
export * from './users';
export * from './merchants';
export * from './categories';  // Must be before products
export * from './products';
export * from './orders';
export * from './cart';
export * from './addresses';
export * from './payments';
export * from './notifications';
export * from './settings';
