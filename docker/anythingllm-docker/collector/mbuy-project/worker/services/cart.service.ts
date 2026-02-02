/**
 * Cart Service
 * Handles shopping cart business logic
 */

import { eq, and, sql } from 'drizzle-orm';
import type { Database } from '../db';
import type { Env } from '../types';
import { carts, cartItems, savedItems, type Cart, type NewCart, type CartItem, type NewCartItem } from '../db/schema/cart';
import { products, productVariants } from '../db/schema/products';

export interface CartWithItems extends Cart {
  items: CartItemWithProduct[];
  totals: {
    subtotal: number;
    itemCount: number;
  };
}

export interface CartItemWithProduct extends CartItem {
  product: {
    id: string;
    name: string;
    nameAr: string;
    price: string;
    salePrice: string | null;
    image: string | null;
    stock: number;
    merchantId: string;
  };
  variant?: {
    id: string;
    name: string;
    price: string;
    stock: number;
  } | null;
}

export class CartService {
  constructor(
    private db: Database,
    private env: Env
  ) {}

  /**
   * Get or create cart for customer
   */
  async getOrCreateCart(customerId: string, merchantId: string): Promise<Cart> {
    // Try to get existing active cart
    const [existingCart] = await this.db
      .select()
      .from(carts)
      .where(
        and(
          eq(carts.customerId, customerId),
          eq(carts.merchantId, merchantId),
          eq(carts.status, 'active')
        )
      )
      .limit(1);

    if (existingCart) {
      return existingCart;
    }

    // Create new cart
    const [newCart] = await this.db
      .insert(carts)
      .values({
        customerId,
        merchantId,
        status: 'active',
      })
      .returning();

    return newCart;
  }

  /**
   * Get cart by ID
   */
  async getById(id: string): Promise<Cart | null> {
    const [cart] = await this.db
      .select()
      .from(carts)
      .where(eq(carts.id, id))
      .limit(1);

    return cart || null;
  }

  /**
   * Get cart with items and product details
   */
  async getCartWithItems(customerId: string, merchantId: string): Promise<CartWithItems | null> {
    const cart = await this.getOrCreateCart(customerId, merchantId);

    // Get cart items with product info
    const items = await this.db
      .select({
        cartItem: cartItems,
        product: {
          id: products.id,
          name: products.name,
          nameAr: products.nameAr,
          price: products.price,
          compareAtPrice: products.compareAtPrice,
          thumbnailUrl: products.thumbnailUrl,
          stockQuantity: products.stockQuantity,
          merchantId: products.merchantId,
        },
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.cartId, cart.id));

    // Process items and calculate totals
    let subtotal = 0;
    let itemCount = 0;

    const processedItems: CartItemWithProduct[] = [];

    for (const item of items) {
      let variant = null;
      let price = parseFloat(item.product.compareAtPrice || item.product.price);

      // Get variant if specified
      if (item.cartItem.variantId) {
        const [variantData] = await this.db
          .select()
          .from(productVariants)
          .where(eq(productVariants.id, item.cartItem.variantId))
          .limit(1);

        if (variantData) {
          variant = {
            id: variantData.id,
            name: variantData.name,
            price: variantData.price,
            stock: variantData.stockQuantity,
          };
          price = parseFloat(variantData.price);
        }
      }

      subtotal += price * item.cartItem.quantity;
      itemCount += item.cartItem.quantity;

      processedItems.push({
        ...item.cartItem,
        product: {
          ...item.product,
          salePrice: item.product.compareAtPrice,
          image: item.product.thumbnailUrl,
          stock: item.product.stockQuantity,
        },
        variant,
      });
    }

    return {
      ...cart,
      items: processedItems,
      totals: {
        subtotal,
        itemCount,
      },
    };
  }

  /**
   * Add item to cart
   */
  async addItem(
    customerId: string,
    merchantId: string,
    productId: string,
    quantity: number,
    variantId?: string
  ): Promise<CartItem> {
    const cart = await this.getOrCreateCart(customerId, merchantId);

    // Check if item already exists in cart
    const [existingItem] = await this.db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.cartId, cart.id),
          eq(cartItems.productId, productId),
          variantId 
            ? eq(cartItems.variantId, variantId)
            : sql`${cartItems.variantId} IS NULL`
        )
      )
      .limit(1);

    if (existingItem) {
      // Update quantity
      const [updated] = await this.db
        .update(cartItems)
        .set({ 
          quantity: existingItem.quantity + quantity,
          updatedAt: new Date(),
        })
        .where(eq(cartItems.id, existingItem.id))
        .returning();

      return updated;
    }

    // Check stock and get price
    const stockCheck = await this.checkStock(productId, variantId, quantity);
    if (!stockCheck.available) {
      throw new Error('Insufficient stock');
    }

    // Add new item
    const [newItem] = await this.db
      .insert(cartItems)
      .values({
        cartId: cart.id,
        productId,
        variantId,
        quantity,
        unitPrice: stockCheck.price,
      })
      .returning();

    // Update cart timestamp
    await this.db
      .update(carts)
      .set({ updatedAt: new Date() })
      .where(eq(carts.id, cart.id));

    return newItem;
  }

  /**
   * Update item quantity
   */
  async updateItemQuantity(
    customerId: string,
    merchantId: string,
    itemId: string,
    quantity: number
  ): Promise<CartItem | null> {
    const cart = await this.getOrCreateCart(customerId, merchantId);

    // Get current item
    const [item] = await this.db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.id, itemId),
          eq(cartItems.cartId, cart.id)
        )
      )
      .limit(1);

    if (!item) {
      return null;
    }

    // Check stock
    const stockCheck = await this.checkStock(item.productId, item.variantId || undefined, quantity);
    if (!stockCheck.available) {
      throw new Error('Insufficient stock');
    }

    // Update quantity
    const [updated] = await this.db
      .update(cartItems)
      .set({ quantity, updatedAt: new Date() })
      .where(eq(cartItems.id, itemId))
      .returning();

    return updated || null;
  }

  /**
   * Remove item from cart
   */
  async removeItem(customerId: string, merchantId: string, itemId: string): Promise<boolean> {
    const cart = await this.getOrCreateCart(customerId, merchantId);

    const result = await this.db
      .delete(cartItems)
      .where(
        and(
          eq(cartItems.id, itemId),
          eq(cartItems.cartId, cart.id)
        )
      );

    return (result as any).rowCount > 0;
  }

  /**
   * Clear cart
   */
  async clearCart(customerId: string, merchantId: string): Promise<void> {
    const cart = await this.getOrCreateCart(customerId, merchantId);

    await this.db
      .delete(cartItems)
      .where(eq(cartItems.cartId, cart.id));

    await this.db
      .update(carts)
      .set({ updatedAt: new Date() })
      .where(eq(carts.id, cart.id));
  }

  // ============ Saved Items (Wishlist) ============

  /**
   * Get saved items for customer
   */
  async getSavedItems(customerId: string): Promise<any[]> {
    return this.db
      .select({
        savedItem: savedItems,
        product: {
          id: products.id,
          name: products.name,
          nameAr: products.nameAr,
          price: products.price,
          compareAtPrice: products.compareAtPrice,
          thumbnailUrl: products.thumbnailUrl,
          stockQuantity: products.stockQuantity,
        },
      })
      .from(savedItems)
      .innerJoin(products, eq(savedItems.productId, products.id))
      .where(eq(savedItems.customerId, customerId));
  }

  /**
   * Save item for later (add to wishlist)
   */
  async saveForLater(customerId: string, productId: string): Promise<void> {
    // Check if already saved
    const [existing] = await this.db
      .select()
      .from(savedItems)
      .where(
        and(
          eq(savedItems.customerId, customerId),
          eq(savedItems.productId, productId)
        )
      )
      .limit(1);

    if (existing) {
      return; // Already saved
    }

    await this.db
      .insert(savedItems)
      .values({ customerId, productId });
  }

  /**
   * Remove saved item
   */
  async removeSavedItem(customerId: string, productId: string): Promise<boolean> {
    const result = await this.db
      .delete(savedItems)
      .where(
        and(
          eq(savedItems.customerId, customerId),
          eq(savedItems.productId, productId)
        )
      );

    return (result as any).rowCount > 0;
  }

  /**
   * Move saved item to cart
   */
  async moveSavedToCart(
    customerId: string,
    merchantId: string,
    productId: string,
    quantity: number = 1
  ): Promise<CartItem> {
    // Add to cart
    const cartItem = await this.addItem(customerId, merchantId, productId, quantity);

    // Remove from saved
    await this.removeSavedItem(customerId, productId);

    return cartItem;
  }

  /**
   * Move cart item to saved
   */
  async moveCartToSaved(customerId: string, merchantId: string, itemId: string): Promise<void> {
    const cart = await this.getOrCreateCart(customerId, merchantId);

    // Get cart item
    const [item] = await this.db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.id, itemId),
          eq(cartItems.cartId, cart.id)
        )
      )
      .limit(1);

    if (!item) {
      throw new Error('Item not found');
    }

    // Save for later
    await this.saveForLater(customerId, item.productId);

    // Remove from cart
    await this.removeItem(customerId, merchantId, itemId);
  }

  // ============ Helpers ============

  private async checkStock(productId: string, variantId: string | undefined, quantity: number): Promise<{ available: boolean; price: string }> {
    if (variantId) {
      const [variant] = await this.db
        .select({ stockQuantity: productVariants.stockQuantity, price: productVariants.price })
        .from(productVariants)
        .where(eq(productVariants.id, variantId))
        .limit(1);

      return variant 
        ? { available: variant.stockQuantity >= quantity, price: variant.price }
        : { available: false, price: '0' };
    }

    const [product] = await this.db
      .select({ stockQuantity: products.stockQuantity, price: products.price })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    return product
      ? { available: (product.stockQuantity || 0) >= quantity, price: product.price }
      : { available: false, price: '0' };
  }
}
