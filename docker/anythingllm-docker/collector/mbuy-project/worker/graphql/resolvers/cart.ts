/**
 * Cart GraphQL Resolvers
 */

import { eq, and } from 'drizzle-orm';
import { GraphQLContext } from '../context';
import * as schema from '../../db/schema';
import { requireCustomer, formatMoney, getPagination } from './base';

export const cartResolvers = {
  Query: {
    // Get cart for merchant
    cart: async (
      _: unknown,
      args: { merchantId: string },
      ctx: GraphQLContext
    ) => {
      if (!ctx.isAuthenticated) {
        return null;
      }
      
      const [cart] = await ctx.db
        .select()
        .from(schema.carts)
        .where(
          and(
            eq(schema.carts.customerId, ctx.auth!.userId),
            eq(schema.carts.merchantId, args.merchantId),
            eq(schema.carts.status, 'active')
          )
        )
        .limit(1);
      
      return cart || null;
    },

    // Cart summary for checkout
    cartSummary: async (
      _: unknown,
      args: {
        merchantId: string;
        deliveryType?: string;
        addressId?: string;
        couponCode?: string;
      },
      ctx: GraphQLContext
    ) => {
      requireCustomer(ctx);
      
      // Get cart with items
      const [cart] = await ctx.db
        .select()
        .from(schema.carts)
        .where(
          and(
            eq(schema.carts.customerId, ctx.auth!.userId),
            eq(schema.carts.merchantId, args.merchantId),
            eq(schema.carts.status, 'active')
          )
        );
      
      if (!cart) {
        return {
          itemCount: 0,
          subtotal: 0,
          taxAmount: 0,
          shippingAmount: 0,
          discountAmount: 0,
          totalAmount: 0,
          currency: 'SAR',
          subtotalFormatted: formatMoney(0),
          taxFormatted: formatMoney(0),
          shippingFormatted: formatMoney(0),
          discountFormatted: formatMoney(0),
          totalFormatted: formatMoney(0),
          deliveryAvailable: true,
          pickupAvailable: false,
          meetsMinimumOrder: true,
        };
      }
      
      // Get cart items
      const items = await ctx.db
        .select()
        .from(schema.cartItems)
        .where(eq(schema.cartItems.cartId, cart.id));
      
      // Calculate subtotal
      let subtotal = 0;
      for (const item of items) {
        subtotal += parseFloat(item.unitPrice as any) * item.quantity;
      }
      
      // Get merchant for tax and settings
      const merchant = await ctx.loaders.merchantLoader.load(args.merchantId);
      const taxRate = merchant?.taxEnabled ? parseFloat(merchant.taxRate as any || '15') : 0;
      const taxAmount = subtotal * (taxRate / 100);
      const shippingAmount = 0; // TODO: Calculate shipping
      const discountAmount = parseFloat(cart.couponDiscount as any || '0');
      const totalAmount = subtotal + taxAmount + shippingAmount - discountAmount;
      
      const minOrderAmount = parseFloat(merchant?.minOrderAmount as any || '0');
      
      return {
        itemCount: items.length,
        subtotal,
        taxAmount,
        shippingAmount,
        discountAmount,
        totalAmount,
        currency: merchant?.currency || 'SAR',
        subtotalFormatted: formatMoney(subtotal),
        taxFormatted: formatMoney(taxAmount),
        shippingFormatted: formatMoney(shippingAmount),
        discountFormatted: formatMoney(discountAmount),
        totalFormatted: formatMoney(totalAmount),
        couponCode: cart.couponCode,
        couponValid: !!cart.couponCode,
        deliveryAvailable: merchant?.deliveryEnabled ?? true,
        pickupAvailable: merchant?.pickupEnabled ?? false,
        meetsMinimumOrder: subtotal >= minOrderAmount,
        minimumOrderAmount: minOrderAmount,
        minimumOrderMessage: subtotal < minOrderAmount
          ? `الحد الأدنى للطلب ${formatMoney(minOrderAmount)}`
          : null,
      };
    },

    // Validate cart
    validateCart: async (
      _: unknown,
      args: { merchantId: string },
      ctx: GraphQLContext
    ) => {
      requireCustomer(ctx);
      
      const errors: any[] = [];
      const warnings: any[] = [];
      
      // Get cart
      const [cart] = await ctx.db
        .select()
        .from(schema.carts)
        .where(
          and(
            eq(schema.carts.customerId, ctx.auth!.userId),
            eq(schema.carts.merchantId, args.merchantId),
            eq(schema.carts.status, 'active')
          )
        );
      
      if (!cart) {
        errors.push({ type: 'EMPTY_CART', message: 'السلة فارغة' });
        return { valid: false, errors, warnings };
      }
      
      // Get items
      const items = await ctx.db
        .select()
        .from(schema.cartItems)
        .where(eq(schema.cartItems.cartId, cart.id));
      
      if (items.length === 0) {
        errors.push({ type: 'EMPTY_CART', message: 'السلة فارغة' });
        return { valid: false, errors, warnings };
      }
      
      // Check each item
      for (const item of items) {
        const product = await ctx.loaders.productLoader.load(item.productId);
        
        if (!product) {
          errors.push({
            type: 'PRODUCT_NOT_FOUND',
            message: 'المنتج غير متوفر',
            itemId: item.id,
            productId: item.productId,
          });
          continue;
        }
        
        if (product.status !== 'active') {
          errors.push({
            type: 'PRODUCT_UNAVAILABLE',
            message: `${product.name} غير متوفر حالياً`,
            itemId: item.id,
            productId: item.productId,
          });
        }
        
        if (product.trackInventory && (product.stockQuantity || 0) < item.quantity) {
          if ((product.stockQuantity || 0) === 0) {
            errors.push({
              type: 'OUT_OF_STOCK',
              message: `${product.name} نفد من المخزون`,
              itemId: item.id,
              productId: item.productId,
            });
          } else {
            warnings.push({
              type: 'LOW_STOCK',
              message: `${product.name} متوفر فقط ${product.stockQuantity} قطعة`,
              itemId: item.id,
              productId: item.productId,
            });
          }
        }
        
        // Check price changes
        const currentPrice = parseFloat(product.price as any);
        const cartPrice = parseFloat(item.unitPrice as any);
        if (currentPrice !== cartPrice) {
          warnings.push({
            type: 'PRICE_CHANGED',
            message: `تغير سعر ${product.name}`,
            itemId: item.id,
            productId: item.productId,
          });
        }
      }
      
      return {
        valid: errors.length === 0,
        errors,
        warnings,
      };
    },
  },

  Mutation: {
    // Add to cart
    addToCart: async (
      _: unknown,
      args: { input: any },
      ctx: GraphQLContext
    ) => {
      requireCustomer(ctx);
      
      // Get or create cart
      let [cart] = await ctx.db
        .select()
        .from(schema.carts)
        .where(
          and(
            eq(schema.carts.customerId, ctx.auth!.userId),
            eq(schema.carts.merchantId, args.input.merchantId),
            eq(schema.carts.status, 'active')
          )
        );
      
      if (!cart) {
        [cart] = await ctx.db
          .insert(schema.carts)
          .values({
            customerId: ctx.auth!.userId,
            merchantId: args.input.merchantId,
          })
          .returning();
      }
      
      // Get product price
      const product = await ctx.loaders.productLoader.load(args.input.productId);
      if (!product) {
        throw new Error('Product not found');
      }
      
      let unitPrice = parseFloat(product.price as any);
      
      if (args.input.variantId) {
        const variant = await ctx.loaders.productVariantLoader.load(args.input.variantId);
        if (variant) {
          unitPrice = parseFloat(variant.price as any);
        }
      }
      
      // Check if item already in cart
      const [existingItem] = await ctx.db
        .select()
        .from(schema.cartItems)
        .where(
          and(
            eq(schema.cartItems.cartId, cart.id),
            eq(schema.cartItems.productId, args.input.productId)
          )
        );
      
      if (existingItem) {
        // Update quantity
        await ctx.db
          .update(schema.cartItems)
          .set({
            quantity: existingItem.quantity + args.input.quantity,
            updatedAt: new Date(),
          })
          .where(eq(schema.cartItems.id, existingItem.id));
      } else {
        // Add new item
        await ctx.db
          .insert(schema.cartItems)
          .values({
            cartId: cart.id,
            productId: args.input.productId,
            variantId: args.input.variantId,
            quantity: args.input.quantity,
            unitPrice: unitPrice.toString(),
            options: args.input.options,
            notes: args.input.notes,
          });
      }
      
      // Update cart totals
      await updateCartTotals(ctx, cart.id);
      
      // Return updated cart
      const [updatedCart] = await ctx.db
        .select()
        .from(schema.carts)
        .where(eq(schema.carts.id, cart.id));
      
      return updatedCart;
    },

    // Update cart item
    updateCartItem: async (
      _: unknown,
      args: { itemId: string; input: any },
      ctx: GraphQLContext
    ) => {
      requireCustomer(ctx);
      
      const [item] = await ctx.db
        .select()
        .from(schema.cartItems)
        .where(eq(schema.cartItems.id, args.itemId));
      
      if (!item) {
        throw new Error('Item not found');
      }
      
      // Verify ownership
      const [cart] = await ctx.db
        .select()
        .from(schema.carts)
        .where(
          and(
            eq(schema.carts.id, item.cartId),
            eq(schema.carts.customerId, ctx.auth!.userId)
          )
        );
      
      if (!cart) {
        throw new Error('Access denied');
      }
      
      if (args.input.quantity <= 0) {
        // Remove item
        await ctx.db.delete(schema.cartItems).where(eq(schema.cartItems.id, args.itemId));
      } else {
        // Update item
        await ctx.db
          .update(schema.cartItems)
          .set({
            ...args.input,
            updatedAt: new Date(),
          })
          .where(eq(schema.cartItems.id, args.itemId));
      }
      
      await updateCartTotals(ctx, cart.id);
      
      const [updatedCart] = await ctx.db
        .select()
        .from(schema.carts)
        .where(eq(schema.carts.id, cart.id));
      
      return updatedCart;
    },

    // Remove from cart
    removeFromCart: async (
      _: unknown,
      args: { itemId: string },
      ctx: GraphQLContext
    ) => {
      requireCustomer(ctx);
      
      const [item] = await ctx.db
        .select()
        .from(schema.cartItems)
        .where(eq(schema.cartItems.id, args.itemId));
      
      if (!item) {
        throw new Error('Item not found');
      }
      
      // Verify ownership
      const [cart] = await ctx.db
        .select()
        .from(schema.carts)
        .where(
          and(
            eq(schema.carts.id, item.cartId),
            eq(schema.carts.customerId, ctx.auth!.userId)
          )
        );
      
      if (!cart) {
        throw new Error('Access denied');
      }
      
      await ctx.db.delete(schema.cartItems).where(eq(schema.cartItems.id, args.itemId));
      await updateCartTotals(ctx, cart.id);
      
      const [updatedCart] = await ctx.db
        .select()
        .from(schema.carts)
        .where(eq(schema.carts.id, cart.id));
      
      return updatedCart;
    },

    // Clear cart
    clearCart: async (
      _: unknown,
      args: { merchantId: string },
      ctx: GraphQLContext
    ) => {
      requireCustomer(ctx);
      
      const [cart] = await ctx.db
        .select()
        .from(schema.carts)
        .where(
          and(
            eq(schema.carts.customerId, ctx.auth!.userId),
            eq(schema.carts.merchantId, args.merchantId),
            eq(schema.carts.status, 'active')
          )
        );
      
      if (cart) {
        await ctx.db.delete(schema.cartItems).where(eq(schema.cartItems.cartId, cart.id));
        await ctx.db.delete(schema.carts).where(eq(schema.carts.id, cart.id));
      }
      
      return { success: true, message: 'Cart cleared' };
    },
  },

  // Field resolvers
  Cart: {
    subtotalFormatted: (parent: schema.Cart) => formatMoney(parent.subtotal),
    couponDiscountFormatted: (parent: schema.Cart) =>
      parent.couponDiscount ? formatMoney(parent.couponDiscount) : null,

    customer: async (parent: schema.Cart, _: unknown, ctx: GraphQLContext) => {
      if (!parent.customerId) return null;
      return ctx.loaders.customerLoader.load(parent.customerId);
    },

    merchant: async (parent: schema.Cart, _: unknown, ctx: GraphQLContext) => {
      return ctx.loaders.merchantLoader.load(parent.merchantId);
    },

    items: async (parent: schema.Cart, _: unknown, ctx: GraphQLContext) => {
      return ctx.db
        .select()
        .from(schema.cartItems)
        .where(eq(schema.cartItems.cartId, parent.id));
    },
  },

  CartItem: {
    unitPriceFormatted: (parent: schema.CartItem) => formatMoney(parent.unitPrice),
    totalPriceFormatted: (parent: schema.CartItem) =>
      formatMoney(parseFloat(parent.unitPrice as any) * parent.quantity),
    totalPrice: (parent: schema.CartItem) =>
      parseFloat(parent.unitPrice as any) * parent.quantity,

    product: async (parent: schema.CartItem, _: unknown, ctx: GraphQLContext) => {
      return ctx.loaders.productLoader.load(parent.productId);
    },

    variant: async (parent: schema.CartItem, _: unknown, ctx: GraphQLContext) => {
      if (!parent.variantId) return null;
      return ctx.loaders.productVariantLoader.load(parent.variantId);
    },

    inStock: async (parent: schema.CartItem, _: unknown, ctx: GraphQLContext) => {
      if (parent.variantId) {
        const variant = await ctx.loaders.productVariantLoader.load(parent.variantId);
        return variant ? (variant.stockQuantity || 0) >= parent.quantity : false;
      }
      const product = await ctx.loaders.productLoader.load(parent.productId);
      if (!product?.trackInventory) return true;
      return (product.stockQuantity || 0) >= parent.quantity;
    },

    availableQuantity: async (parent: schema.CartItem, _: unknown, ctx: GraphQLContext) => {
      if (parent.variantId) {
        const variant = await ctx.loaders.productVariantLoader.load(parent.variantId);
        return variant?.stockQuantity || 0;
      }
      const product = await ctx.loaders.productLoader.load(parent.productId);
      return product?.stockQuantity || 0;
    },

    priceChanged: async (parent: schema.CartItem, _: unknown, ctx: GraphQLContext) => {
      const product = await ctx.loaders.productLoader.load(parent.productId);
      if (!product) return false;
      return parseFloat(product.price as any) !== parseFloat(parent.unitPrice as any);
    },

    originalPrice: async (parent: schema.CartItem, _: unknown, ctx: GraphQLContext) => {
      const product = await ctx.loaders.productLoader.load(parent.productId);
      return product ? parseFloat(product.price as any) : null;
    },
  },
};

// Helper to update cart totals
async function updateCartTotals(ctx: GraphQLContext, cartId: string) {
  const items = await ctx.db
    .select()
    .from(schema.cartItems)
    .where(eq(schema.cartItems.cartId, cartId));
  
  let subtotal = 0;
  for (const item of items) {
    subtotal += parseFloat(item.unitPrice as any) * item.quantity;
  }
  
  await ctx.db
    .update(schema.carts)
    .set({
      itemCount: items.length,
      subtotal: subtotal.toString(),
      lastActivityAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(schema.carts.id, cartId));
}
