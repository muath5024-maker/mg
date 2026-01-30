import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductService } from '../src/services/product.service';

// Mock the database
const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  and: vi.fn().mockReturnThis(),
  or: vi.fn().mockReturnThis(),
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
  delete: vi.fn().mockReturnThis(),
};

describe('ProductService', () => {
  let productService: ProductService;

  beforeEach(() => {
    vi.clearAllMocks();
    productService = new ProductService(mockDb as any);
  });

  describe('getProducts', () => {
    it('should return paginated products', async () => {
      const mockProducts = [
        { id: '1', name: 'Product 1', price: 100 },
        { id: '2', name: 'Product 2', price: 200 },
      ];
      mockDb.returning.mockResolvedValueOnce(mockProducts);
      mockDb.returning.mockResolvedValueOnce([{ count: 10 }]);

      const result = await productService.getProducts({
        merchantId: 'merchant-123',
        first: 10,
      });

      expect(result.products).toHaveLength(2);
      expect(result.totalCount).toBe(10);
      expect(mockDb.where).toHaveBeenCalled();
    });

    it('should filter by category', async () => {
      const mockProducts = [
        { id: '1', name: 'Product 1', categoryId: 'cat-1' },
      ];
      mockDb.returning.mockResolvedValueOnce(mockProducts);
      mockDb.returning.mockResolvedValueOnce([{ count: 1 }]);

      const result = await productService.getProducts({
        merchantId: 'merchant-123',
        categoryId: 'cat-1',
        first: 10,
      });

      expect(result.products).toHaveLength(1);
    });

    it('should filter by search query', async () => {
      const mockProducts = [
        { id: '1', name: 'iPhone 15', price: 1000 },
      ];
      mockDb.returning.mockResolvedValueOnce(mockProducts);
      mockDb.returning.mockResolvedValueOnce([{ count: 1 }]);

      const result = await productService.getProducts({
        merchantId: 'merchant-123',
        search: 'iPhone',
        first: 10,
      });

      expect(result.products).toHaveLength(1);
      expect(result.products[0].name).toContain('iPhone');
    });

    it('should filter by status', async () => {
      const mockProducts = [
        { id: '1', name: 'Active Product', status: 'active' },
      ];
      mockDb.returning.mockResolvedValueOnce(mockProducts);
      mockDb.returning.mockResolvedValueOnce([{ count: 1 }]);

      const result = await productService.getProducts({
        merchantId: 'merchant-123',
        status: 'active',
        first: 10,
      });

      expect(result.products[0].status).toBe('active');
    });
  });

  describe('getProduct', () => {
    it('should return product by ID', async () => {
      const mockProduct = {
        id: 'prod-123',
        name: 'Test Product',
        price: 100,
        stockQuantity: 50,
      };
      mockDb.returning.mockResolvedValueOnce([mockProduct]);

      const result = await productService.getProduct('prod-123');

      expect(result).toBeDefined();
      expect(result?.id).toBe('prod-123');
    });

    it('should return null for non-existent product', async () => {
      mockDb.returning.mockResolvedValueOnce([]);

      const result = await productService.getProduct('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('createProduct', () => {
    it('should create new product', async () => {
      const newProduct = {
        id: 'new-prod-123',
        merchantId: 'merchant-123',
        name: 'New Product',
        sku: 'SKU-001',
        price: 150,
        stockQuantity: 100,
        status: 'draft',
      };
      mockDb.returning.mockResolvedValueOnce([newProduct]);

      const result = await productService.createProduct({
        merchantId: 'merchant-123',
        name: 'New Product',
        sku: 'SKU-001',
        price: 150,
        stockQuantity: 100,
      });

      expect(result.id).toBe('new-prod-123');
      expect(result.name).toBe('New Product');
    });

    it('should set default status to draft', async () => {
      const newProduct = {
        id: 'new-prod-123',
        status: 'draft',
      };
      mockDb.returning.mockResolvedValueOnce([newProduct]);

      const result = await productService.createProduct({
        merchantId: 'merchant-123',
        name: 'New Product',
        sku: 'SKU-001',
        price: 150,
        stockQuantity: 100,
      });

      expect(result.status).toBe('draft');
    });
  });

  describe('updateProduct', () => {
    it('should update product fields', async () => {
      const updatedProduct = {
        id: 'prod-123',
        name: 'Updated Product',
        price: 200,
      };
      mockDb.returning.mockResolvedValueOnce([updatedProduct]);

      const result = await productService.updateProduct('prod-123', {
        name: 'Updated Product',
        price: 200,
      });

      expect(result?.name).toBe('Updated Product');
      expect(result?.price).toBe(200);
    });

    it('should return null for non-existent product', async () => {
      mockDb.returning.mockResolvedValueOnce([]);

      const result = await productService.updateProduct('non-existent', {
        name: 'Updated',
      });

      expect(result).toBeNull();
    });
  });

  describe('deleteProduct', () => {
    it('should delete product', async () => {
      mockDb.returning.mockResolvedValueOnce([{ id: 'prod-123' }]);

      const result = await productService.deleteProduct('prod-123');

      expect(result).toBe(true);
    });

    it('should return false for non-existent product', async () => {
      mockDb.returning.mockResolvedValueOnce([]);

      const result = await productService.deleteProduct('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('updateStock', () => {
    it('should update stock quantity', async () => {
      mockDb.returning.mockResolvedValueOnce([{ 
        id: 'prod-123', 
        stockQuantity: 150 
      }]);

      const result = await productService.updateStock('prod-123', 50);

      expect(result.newQuantity).toBe(150);
    });

    it('should handle negative stock adjustment', async () => {
      mockDb.returning.mockResolvedValueOnce([{ 
        id: 'prod-123', 
        stockQuantity: 50 
      }]);

      const result = await productService.updateStock('prod-123', -30);

      expect(result.newQuantity).toBe(50);
    });

    it('should not allow negative stock', async () => {
      mockDb.returning.mockResolvedValueOnce([{ 
        id: 'prod-123', 
        stockQuantity: 0 
      }]);

      await expect(productService.updateStock('prod-123', -100))
        .rejects.toThrow('Insufficient stock');
    });
  });

  describe('getLowStockProducts', () => {
    it('should return products below threshold', async () => {
      const lowStockProducts = [
        { id: '1', name: 'Low Stock 1', stockQuantity: 5, lowStockThreshold: 10 },
        { id: '2', name: 'Low Stock 2', stockQuantity: 3, lowStockThreshold: 10 },
      ];
      mockDb.returning.mockResolvedValueOnce(lowStockProducts);

      const result = await productService.getLowStockProducts('merchant-123');

      expect(result).toHaveLength(2);
      result.forEach(product => {
        expect(product.stockQuantity).toBeLessThan(product.lowStockThreshold);
      });
    });

    it('should use custom threshold', async () => {
      const lowStockProducts = [
        { id: '1', name: 'Low Stock', stockQuantity: 15 },
      ];
      mockDb.returning.mockResolvedValueOnce(lowStockProducts);

      const result = await productService.getLowStockProducts('merchant-123', 20);

      expect(result).toHaveLength(1);
    });
  });

  describe('getFeaturedProducts', () => {
    it('should return featured products', async () => {
      const featuredProducts = [
        { id: '1', name: 'Featured 1', isFeatured: true },
        { id: '2', name: 'Featured 2', isFeatured: true },
      ];
      mockDb.returning.mockResolvedValueOnce(featuredProducts);

      const result = await productService.getFeaturedProducts('merchant-123');

      expect(result).toHaveLength(2);
      result.forEach(product => {
        expect(product.isFeatured).toBe(true);
      });
    });

    it('should limit results', async () => {
      const featuredProducts = [
        { id: '1', name: 'Featured 1', isFeatured: true },
      ];
      mockDb.returning.mockResolvedValueOnce(featuredProducts);

      const result = await productService.getFeaturedProducts('merchant-123', 1);

      expect(result).toHaveLength(1);
    });
  });

  describe('searchProducts', () => {
    it('should search by name', async () => {
      const searchResults = [
        { id: '1', name: 'iPhone 15 Pro', price: 1200 },
        { id: '2', name: 'iPhone 15', price: 1000 },
      ];
      mockDb.returning.mockResolvedValueOnce(searchResults);

      const result = await productService.searchProducts({
        query: 'iPhone',
        merchantId: 'merchant-123',
      });

      expect(result).toHaveLength(2);
    });

    it('should filter by price range', async () => {
      const searchResults = [
        { id: '1', name: 'Product', price: 150 },
      ];
      mockDb.returning.mockResolvedValueOnce(searchResults);

      const result = await productService.searchProducts({
        query: 'Product',
        minPrice: 100,
        maxPrice: 200,
      });

      expect(result).toHaveLength(1);
      expect(result[0].price).toBeGreaterThanOrEqual(100);
      expect(result[0].price).toBeLessThanOrEqual(200);
    });

    it('should filter by category', async () => {
      const searchResults = [
        { id: '1', name: 'Electronics', categoryId: 'electronics' },
      ];
      mockDb.returning.mockResolvedValueOnce(searchResults);

      const result = await productService.searchProducts({
        query: 'Electronics',
        categoryId: 'electronics',
      });

      expect(result).toHaveLength(1);
    });
  });

  describe('bulkUpdateStatus', () => {
    it('should update multiple products status', async () => {
      mockDb.returning.mockResolvedValueOnce([
        { id: '1' }, { id: '2' }, { id: '3' }
      ]);

      const result = await productService.bulkUpdateStatus(
        ['1', '2', '3'],
        'active'
      );

      expect(result.updatedCount).toBe(3);
    });

    it('should handle partial updates', async () => {
      mockDb.returning.mockResolvedValueOnce([
        { id: '1' }, { id: '2' }
      ]);

      const result = await productService.bulkUpdateStatus(
        ['1', '2', 'non-existent'],
        'archived'
      );

      expect(result.updatedCount).toBe(2);
    });
  });
});
