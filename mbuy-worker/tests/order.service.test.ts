import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrderService } from '../src/services/order.service';

// Mock the database
const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  and: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  offset: vi.fn().mockReturnThis(),
  leftJoin: vi.fn().mockReturnThis(),
  innerJoin: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  returning: vi.fn(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  transaction: vi.fn(),
};

describe('OrderService', () => {
  let orderService: OrderService;

  beforeEach(() => {
    vi.clearAllMocks();
    orderService = new OrderService(mockDb as any);
  });

  describe('createOrder', () => {
    it('should create order with items', async () => {
      const mockOrder = {
        id: 'order-123',
        orderNumber: 'ORD-2024-0001',
        status: 'pending',
        total: 500,
      };

      mockDb.transaction.mockImplementation(async (callback: any) => {
        return callback({
          ...mockDb,
          returning: vi.fn()
            .mockResolvedValueOnce([mockOrder]) // Order insert
            .mockResolvedValueOnce([{ id: 'item-1' }, { id: 'item-2' }]), // Items insert
        });
      });

      const result = await orderService.createOrder({
        customerId: 'customer-123',
        merchantId: 'merchant-123',
        items: [
          { productId: 'prod-1', quantity: 2, price: 100 },
          { productId: 'prod-2', quantity: 1, price: 300 },
        ],
        shippingAddress: {
          addressLine1: '123 Test St',
          city: 'Riyadh',
          country: 'Saudi Arabia',
        },
        paymentMethod: 'cash',
      });

      expect(result.id).toBe('order-123');
      expect(result.orderNumber).toBe('ORD-2024-0001');
    });

    it('should generate unique order number', async () => {
      const mockOrder = {
        id: 'order-124',
        orderNumber: 'ORD-2024-0002',
      };

      mockDb.transaction.mockImplementation(async (callback: any) => {
        return callback({
          ...mockDb,
          returning: vi.fn()
            .mockResolvedValueOnce([mockOrder])
            .mockResolvedValueOnce([]),
        });
      });

      const result = await orderService.createOrder({
        customerId: 'customer-123',
        merchantId: 'merchant-123',
        items: [{ productId: 'prod-1', quantity: 1, price: 100 }],
        shippingAddress: {
          addressLine1: '123 Test St',
          city: 'Riyadh',
          country: 'Saudi Arabia',
        },
        paymentMethod: 'card',
      });

      expect(result.orderNumber).toMatch(/^ORD-\d{4}-\d+$/);
    });

    it('should calculate totals correctly', async () => {
      const mockOrder = {
        id: 'order-125',
        subtotal: 500,
        deliveryFee: 20,
        tax: 75,
        discount: 50,
        total: 545, // 500 + 20 + 75 - 50
      };

      mockDb.transaction.mockImplementation(async (callback: any) => {
        return callback({
          ...mockDb,
          returning: vi.fn().mockResolvedValue([mockOrder]),
        });
      });

      const result = await orderService.createOrder({
        customerId: 'customer-123',
        merchantId: 'merchant-123',
        items: [
          { productId: 'prod-1', quantity: 5, price: 100 },
        ],
        shippingAddress: {
          addressLine1: '123 Test St',
          city: 'Riyadh',
          country: 'Saudi Arabia',
        },
        paymentMethod: 'cash',
        couponCode: 'SAVE50',
      });

      expect(result.total).toBe(545);
    });

    it('should validate stock availability', async () => {
      mockDb.returning.mockResolvedValueOnce([
        { id: 'prod-1', stockQuantity: 5 }
      ]);

      await expect(orderService.createOrder({
        customerId: 'customer-123',
        merchantId: 'merchant-123',
        items: [
          { productId: 'prod-1', quantity: 10, price: 100 }, // More than stock
        ],
        shippingAddress: {
          addressLine1: '123 Test St',
          city: 'Riyadh',
          country: 'Saudi Arabia',
        },
        paymentMethod: 'cash',
      })).rejects.toThrow('Insufficient stock');
    });
  });

  describe('getOrders', () => {
    it('should return paginated orders', async () => {
      const mockOrders = [
        { id: '1', orderNumber: 'ORD-001', status: 'pending' },
        { id: '2', orderNumber: 'ORD-002', status: 'completed' },
      ];
      mockDb.returning.mockResolvedValueOnce(mockOrders);
      mockDb.returning.mockResolvedValueOnce([{ count: 10 }]);

      const result = await orderService.getOrders({
        customerId: 'customer-123',
        first: 10,
      });

      expect(result.orders).toHaveLength(2);
      expect(result.totalCount).toBe(10);
    });

    it('should filter by status', async () => {
      const mockOrders = [
        { id: '1', orderNumber: 'ORD-001', status: 'pending' },
      ];
      mockDb.returning.mockResolvedValueOnce(mockOrders);
      mockDb.returning.mockResolvedValueOnce([{ count: 1 }]);

      const result = await orderService.getOrders({
        customerId: 'customer-123',
        status: 'pending',
        first: 10,
      });

      expect(result.orders).toHaveLength(1);
      expect(result.orders[0].status).toBe('pending');
    });

    it('should filter by date range', async () => {
      const mockOrders = [
        { id: '1', createdAt: new Date('2024-01-15') },
      ];
      mockDb.returning.mockResolvedValueOnce(mockOrders);
      mockDb.returning.mockResolvedValueOnce([{ count: 1 }]);

      const result = await orderService.getOrders({
        customerId: 'customer-123',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        first: 10,
      });

      expect(result.orders).toHaveLength(1);
    });
  });

  describe('getOrder', () => {
    it('should return order with items', async () => {
      const mockOrder = {
        id: 'order-123',
        orderNumber: 'ORD-001',
        status: 'pending',
        items: [
          { id: 'item-1', productName: 'Product 1', quantity: 2 },
        ],
      };
      mockDb.returning.mockResolvedValueOnce([mockOrder]);

      const result = await orderService.getOrder('order-123');

      expect(result).toBeDefined();
      expect(result?.orderNumber).toBe('ORD-001');
      expect(result?.items).toHaveLength(1);
    });

    it('should return null for non-existent order', async () => {
      mockDb.returning.mockResolvedValueOnce([]);

      const result = await orderService.getOrder('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status', async () => {
      const mockOrder = {
        id: 'order-123',
        status: 'processing',
      };
      mockDb.returning.mockResolvedValueOnce([mockOrder]);

      const result = await orderService.updateOrderStatus(
        'order-123',
        'processing',
        'Order is being prepared'
      );

      expect(result?.status).toBe('processing');
    });

    it('should add status history entry', async () => {
      mockDb.transaction.mockImplementation(async (callback: any) => {
        return callback({
          ...mockDb,
          returning: vi.fn()
            .mockResolvedValueOnce([{ id: 'order-123', status: 'shipped' }])
            .mockResolvedValueOnce([{ id: 'history-1' }]),
        });
      });

      await orderService.updateOrderStatus('order-123', 'shipped');

      expect(mockDb.transaction).toHaveBeenCalled();
    });

    it('should validate status transition', async () => {
      mockDb.returning.mockResolvedValueOnce([{
        id: 'order-123',
        status: 'delivered', // Already delivered
      }]);

      await expect(orderService.updateOrderStatus('order-123', 'pending'))
        .rejects.toThrow('Invalid status transition');
    });
  });

  describe('cancelOrder', () => {
    it('should cancel pending order', async () => {
      mockDb.returning.mockResolvedValueOnce([{
        id: 'order-123',
        status: 'pending',
      }]);
      mockDb.returning.mockResolvedValueOnce([{
        id: 'order-123',
        status: 'cancelled',
      }]);

      const result = await orderService.cancelOrder('order-123', 'Changed my mind');

      expect(result.success).toBe(true);
    });

    it('should restore stock when cancelled', async () => {
      mockDb.transaction.mockImplementation(async (callback: any) => {
        const tx = {
          ...mockDb,
          returning: vi.fn()
            .mockResolvedValueOnce([{ id: 'order-123', status: 'pending' }])
            .mockResolvedValueOnce([{ id: 'order-123', status: 'cancelled' }])
            .mockResolvedValueOnce([{ productId: 'prod-1', quantity: 2 }]),
        };
        return callback(tx);
      });

      await orderService.cancelOrder('order-123');

      expect(mockDb.transaction).toHaveBeenCalled();
    });

    it('should not cancel delivered order', async () => {
      mockDb.returning.mockResolvedValueOnce([{
        id: 'order-123',
        status: 'delivered',
      }]);

      const result = await orderService.cancelOrder('order-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('cannot be cancelled');
    });
  });

  describe('reorder', () => {
    it('should create new order from existing', async () => {
      const originalOrder = {
        id: 'order-original',
        customerId: 'customer-123',
        merchantId: 'merchant-123',
        items: [
          { productId: 'prod-1', quantity: 2, price: 100 },
        ],
        shippingAddress: {
          addressLine1: '123 Test St',
          city: 'Riyadh',
        },
      };
      const newOrder = {
        id: 'order-new',
        orderNumber: 'ORD-NEW-001',
      };

      mockDb.returning.mockResolvedValueOnce([originalOrder]);
      mockDb.transaction.mockImplementation(async (callback: any) => {
        return callback({
          ...mockDb,
          returning: vi.fn().mockResolvedValue([newOrder]),
        });
      });

      const result = await orderService.reorder('order-original');

      expect(result.id).toBe('order-new');
    });

    it('should check product availability', async () => {
      mockDb.returning.mockResolvedValueOnce([{
        id: 'order-original',
        items: [
          { productId: 'prod-1', quantity: 10 },
        ],
      }]);
      mockDb.returning.mockResolvedValueOnce([
        { id: 'prod-1', stockQuantity: 5, status: 'active' },
      ]);

      await expect(orderService.reorder('order-original'))
        .rejects.toThrow('Some products are unavailable');
    });
  });

  describe('getOrderStats', () => {
    it('should return order statistics', async () => {
      mockDb.returning.mockResolvedValueOnce([{
        totalOrders: 100,
        pendingOrders: 10,
        processingOrders: 15,
        shippedOrders: 20,
        deliveredOrders: 50,
        cancelledOrders: 5,
        totalRevenue: 50000,
        averageOrderValue: 500,
      }]);

      const result = await orderService.getOrderStats('merchant-123');

      expect(result.totalOrders).toBe(100);
      expect(result.totalRevenue).toBe(50000);
      expect(result.averageOrderValue).toBe(500);
    });

    it('should filter by date range', async () => {
      mockDb.returning.mockResolvedValueOnce([{
        totalOrders: 30,
        totalRevenue: 15000,
      }]);

      const result = await orderService.getOrderStats(
        'merchant-123',
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(result.totalOrders).toBe(30);
    });
  });

  describe('assignDelivery', () => {
    it('should assign delivery driver', async () => {
      mockDb.returning.mockResolvedValueOnce([{
        id: 'order-123',
        driverId: 'driver-456',
      }]);

      const result = await orderService.assignDelivery(
        'order-123',
        'driver-456',
        '30 minutes'
      );

      expect(result.success).toBe(true);
    });

    it('should update order status to out_for_delivery', async () => {
      mockDb.returning.mockResolvedValueOnce([{
        id: 'order-123',
        status: 'out_for_delivery',
        driverId: 'driver-456',
      }]);

      const result = await orderService.assignDelivery('order-123', 'driver-456');

      expect(result.success).toBe(true);
    });
  });
});
