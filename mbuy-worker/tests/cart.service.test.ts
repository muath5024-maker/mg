import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CartService } from '../src/services/cart.service';

// Mock the database
const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  and: vi.fn().mockReturnThis(),
  leftJoin: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  returning: vi.fn(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  onConflictDoUpdate: vi.fn().mockReturnThis(),
};

describe('CartService', () => {
  let cartService: CartService;

  beforeEach(() => {
    vi.clearAllMocks();
    cartService = new CartService(mockDb as any);
  });

  describe('getCart', () => {
    it('should return cart with items', async () => {
      const mockCart = {
        id: 'cart-123',
        customerId: 'customer-123',
        merchantId: 'merchant-123',
        items: [
          {
            id: 'item-1',
            productId: 'prod-1',
            quantity: 2,
            price: 100,
            product: { name: 'Product 1', images: ['img1.jpg'] },
          },
        ],
      };
      mockDb.returning.mockResolvedValueOnce([mockCart]);

      const result = await cartService.getCart('customer-123', 'merchant-123');

      expect(result).toBeDefined();
      expect(result.items).toHaveLength(1);
    });

    it('should create new cart if not exists', async () => {
      mockDb.returning
        .mockResolvedValueOnce([]) // No existing cart
        .mockResolvedValueOnce([{ 
          id: 'new-cart-123',
          customerId: 'customer-123',
          merchantId: 'merchant-123',
          items: [],
        }]);

      const result = await cartService.getCart('customer-123', 'merchant-123');

      expect(result.id).toBe('new-cart-123');
      expect(result.items).toHaveLength(0);
    });

    it('should calculate subtotal correctly', async () => {
      const mockCart = {
        id: 'cart-123',
        items: [
          { id: 'item-1', quantity: 2, price: 100 },
          { id: 'item-2', quantity: 1, price: 50 },
        ],
      };
      mockDb.returning.mockResolvedValueOnce([mockCart]);

      const result = await cartService.getCart('customer-123', 'merchant-123');

      expect(result.subtotal).toBe(250); // (2 * 100) + (1 * 50)
    });

    it('should return item count', async () => {
      const mockCart = {
        id: 'cart-123',
        items: [
          { id: 'item-1', quantity: 2 },
          { id: 'item-2', quantity: 3 },
        ],
      };
      mockDb.returning.mockResolvedValueOnce([mockCart]);

      const result = await cartService.getCart('customer-123', 'merchant-123');

      expect(result.itemCount).toBe(5); // 2 + 3
    });
  });

  describe('addToCart', () => {
    it('should add new item to cart', async () => {
      mockDb.returning
        .mockResolvedValueOnce([{ id: 'cart-123' }]) // Get/create cart
        .mockResolvedValueOnce([]) // Check existing item
        .mockResolvedValueOnce([{ id: 'item-123', productId: 'prod-1', quantity: 1 }]); // Insert item

      const result = await cartService.addToCart({
        customerId: 'customer-123',
        merchantId: 'merchant-123',
        productId: 'prod-1',
        quantity: 1,
      });

      expect(result).toBeDefined();
    });

    it('should update quantity if item exists', async () => {
      mockDb.returning
        .mockResolvedValueOnce([{ id: 'cart-123' }]) // Get cart
        .mockResolvedValueOnce([{ id: 'item-123', quantity: 2 }]) // Existing item
        .mockResolvedValueOnce([{ id: 'item-123', quantity: 5 }]); // Updated item

      const result = await cartService.addToCart({
        customerId: 'customer-123',
        merchantId: 'merchant-123',
        productId: 'prod-1',
        quantity: 3,
      });

      // Should have updated quantity to 5 (2 + 3)
      expect(result).toBeDefined();
    });

    it('should validate product availability', async () => {
      mockDb.returning
        .mockResolvedValueOnce([{ id: 'cart-123' }])
        .mockResolvedValueOnce([{ id: 'prod-1', stockQuantity: 0 }]); // Out of stock

      await expect(cartService.addToCart({
        customerId: 'customer-123',
        merchantId: 'merchant-123',
        productId: 'prod-1',
        quantity: 1,
      })).rejects.toThrow('Product out of stock');
    });

    it('should validate quantity against stock', async () => {
      mockDb.returning
        .mockResolvedValueOnce([{ id: 'cart-123' }])
        .mockResolvedValueOnce([{ id: 'prod-1', stockQuantity: 5 }]);

      await expect(cartService.addToCart({
        customerId: 'customer-123',
        merchantId: 'merchant-123',
        productId: 'prod-1',
        quantity: 10,
      })).rejects.toThrow('Insufficient stock');
    });
  });

  describe('updateCartItem', () => {
    it('should update item quantity', async () => {
      mockDb.returning.mockResolvedValueOnce([{
        id: 'item-123',
        quantity: 5,
      }]);

      const result = await cartService.updateCartItem('item-123', 5);

      expect(result).toBeDefined();
    });

    it('should remove item if quantity is 0', async () => {
      mockDb.returning
        .mockResolvedValueOnce([{ id: 'item-123' }]); // Delete result

      const result = await cartService.updateCartItem('item-123', 0);

      expect(mockDb.delete).toHaveBeenCalled();
    });

    it('should not allow negative quantity', async () => {
      await expect(cartService.updateCartItem('item-123', -1))
        .rejects.toThrow('Invalid quantity');
    });

    it('should validate stock availability', async () => {
      mockDb.returning.mockResolvedValueOnce([{
        id: 'item-123',
        productId: 'prod-1',
        product: { stockQuantity: 3 },
      }]);

      await expect(cartService.updateCartItem('item-123', 10))
        .rejects.toThrow('Insufficient stock');
    });
  });

  describe('removeFromCart', () => {
    it('should remove item from cart', async () => {
      mockDb.returning.mockResolvedValueOnce([{ id: 'item-123' }]);

      const result = await cartService.removeFromCart('item-123');

      expect(result).toBeDefined();
      expect(mockDb.delete).toHaveBeenCalled();
    });

    it('should return updated cart after removal', async () => {
      mockDb.returning
        .mockResolvedValueOnce([{ id: 'item-123', cartId: 'cart-123' }])
        .mockResolvedValueOnce([{
          id: 'cart-123',
          items: [],
          subtotal: 0,
          itemCount: 0,
        }]);

      const result = await cartService.removeFromCart('item-123');

      expect(result.items).toHaveLength(0);
    });
  });

  describe('clearCart', () => {
    it('should remove all items from cart', async () => {
      mockDb.returning.mockResolvedValueOnce([{ id: 'cart-123' }]);

      const result = await cartService.clearCart('customer-123', 'merchant-123');

      expect(result.success).toBe(true);
      expect(mockDb.delete).toHaveBeenCalled();
    });
  });

  describe('getWishlist', () => {
    it('should return wishlist items', async () => {
      const mockWishlist = [
        {
          id: 'wish-1',
          productId: 'prod-1',
          product: { name: 'Product 1', price: 100 },
          createdAt: new Date(),
        },
      ];
      mockDb.returning.mockResolvedValueOnce(mockWishlist);

      const result = await cartService.getWishlist('customer-123');

      expect(result).toHaveLength(1);
      expect(result[0].productId).toBe('prod-1');
    });

    it('should return empty array if no wishlist items', async () => {
      mockDb.returning.mockResolvedValueOnce([]);

      const result = await cartService.getWishlist('customer-123');

      expect(result).toHaveLength(0);
    });
  });

  describe('addToWishlist', () => {
    it('should add product to wishlist', async () => {
      mockDb.returning
        .mockResolvedValueOnce([]) // Check not already in wishlist
        .mockResolvedValueOnce([{ id: 'wish-1', productId: 'prod-1' }]);

      const result = await cartService.addToWishlist('customer-123', 'prod-1');

      expect(result.success).toBe(true);
    });

    it('should not duplicate wishlist items', async () => {
      mockDb.returning.mockResolvedValueOnce([{ id: 'wish-1' }]); // Already exists

      const result = await cartService.addToWishlist('customer-123', 'prod-1');

      expect(result.success).toBe(true); // Should still succeed (idempotent)
    });
  });

  describe('removeFromWishlist', () => {
    it('should remove product from wishlist', async () => {
      mockDb.returning.mockResolvedValueOnce([{ id: 'wish-1' }]);

      const result = await cartService.removeFromWishlist('customer-123', 'prod-1');

      expect(result.success).toBe(true);
    });

    it('should succeed even if item not in wishlist', async () => {
      mockDb.returning.mockResolvedValueOnce([]);

      const result = await cartService.removeFromWishlist('customer-123', 'prod-1');

      expect(result.success).toBe(true);
    });
  });

  describe('isInWishlist', () => {
    it('should return true if product is in wishlist', async () => {
      mockDb.returning.mockResolvedValueOnce([{ id: 'wish-1' }]);

      const result = await cartService.isInWishlist('customer-123', 'prod-1');

      expect(result).toBe(true);
    });

    it('should return false if product not in wishlist', async () => {
      mockDb.returning.mockResolvedValueOnce([]);

      const result = await cartService.isInWishlist('customer-123', 'prod-1');

      expect(result).toBe(false);
    });
  });

  describe('moveToWishlist', () => {
    it('should move cart item to wishlist', async () => {
      mockDb.returning
        .mockResolvedValueOnce([{ id: 'item-1', productId: 'prod-1' }]) // Get cart item
        .mockResolvedValueOnce([{ id: 'wish-1' }]) // Add to wishlist
        .mockResolvedValueOnce([{ id: 'item-1' }]); // Remove from cart

      const result = await cartService.moveToWishlist('customer-123', 'item-1');

      expect(result.success).toBe(true);
    });
  });

  describe('moveToCart', () => {
    it('should move wishlist item to cart', async () => {
      mockDb.returning
        .mockResolvedValueOnce([{ id: 'wish-1', productId: 'prod-1' }]) // Get wishlist item
        .mockResolvedValueOnce([{ id: 'prod-1', price: 100, stockQuantity: 10 }]) // Get product
        .mockResolvedValueOnce([{ id: 'item-1' }]) // Add to cart
        .mockResolvedValueOnce([{ id: 'wish-1' }]); // Remove from wishlist

      const result = await cartService.moveToCart(
        'customer-123',
        'merchant-123',
        'wish-1'
      );

      expect(result.success).toBe(true);
    });

    it('should fail if product out of stock', async () => {
      mockDb.returning
        .mockResolvedValueOnce([{ id: 'wish-1', productId: 'prod-1' }])
        .mockResolvedValueOnce([{ id: 'prod-1', stockQuantity: 0 }]);

      await expect(cartService.moveToCart('customer-123', 'merchant-123', 'wish-1'))
        .rejects.toThrow('Product out of stock');
    });
  });
});
