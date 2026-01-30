/**
 * Product Service
 * Handles product-related business logic
 */

import { eq, and, or, ilike, desc, asc, sql, inArray } from 'drizzle-orm';
import type { Database } from '../db';
import type { Env } from '../types';
import { products, productVariants, type Product, type NewProduct, type ProductVariant, type NewProductVariant } from '../db/schema/products';

export interface ProductListParams {
  page?: number;
  limit?: number;
  search?: string;
  merchantId?: string;
  categoryId?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'popular' | 'rating';
  inStock?: boolean;
}

export interface ProductListResult {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
}

export class ProductService {
  constructor(
    private db: Database,
    private env: Env
  ) {}

  /**
   * Get product by ID
   */
  async getById(id: string): Promise<Product | null> {
    const [product] = await this.db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    return product || null;
  }

  /**
   * Get product by slug
   */
  async getBySlug(slug: string): Promise<Product | null> {
    const [product] = await this.db
      .select()
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1);

    return product || null;
  }

  /**
   * Get products by IDs
   */
  async getByIds(ids: string[]): Promise<Product[]> {
    if (ids.length === 0) return [];
    
    return this.db
      .select()
      .from(products)
      .where(inArray(products.id, ids));
  }

  /**
   * List products with pagination and filters
   */
  async list(params: ProductListParams = {}): Promise<ProductListResult> {
    const {
      page = 1,
      limit = 20,
      search,
      merchantId,
      categoryId,
      status,
      minPrice,
      maxPrice,
      sortBy = 'newest',
      inStock,
    } = params;
    const offset = (page - 1) * limit;

    // Build conditions
    const conditions = [];
    
    if (status) {
      conditions.push(eq(products.status, status));
    } else {
      conditions.push(eq(products.status, 'active'));
    }
    
    if (merchantId) {
      conditions.push(eq(products.merchantId, merchantId));
    }
    
    if (categoryId) {
      conditions.push(eq(products.categoryId, categoryId));
    }
    
    if (minPrice !== undefined) {
      conditions.push(sql`${products.price} >= ${minPrice}`);
    }
    
    if (maxPrice !== undefined) {
      conditions.push(sql`${products.price} <= ${maxPrice}`);
    }
    
    if (inStock) {
      conditions.push(sql`${products.stockQuantity} > 0`);
    }
    
    if (search) {
      conditions.push(
        sql`(
          ${products.name} ILIKE ${'%' + search + '%'} 
          OR ${products.nameAr} ILIKE ${'%' + search + '%'}
          OR ${products.description} ILIKE ${'%' + search + '%'}
        )`
      );
    }

    const whereClause = and(...conditions);

    // Build sort order
    let orderByClause;
    switch (sortBy) {
      case 'price_asc':
        orderByClause = asc(products.price);
        break;
      case 'price_desc':
        orderByClause = desc(products.price);
        break;
      case 'rating':
        orderByClause = desc(products.rating);
        break;
      case 'popular':
        orderByClause = desc(products.salesCount);
        break;
      case 'newest':
      default:
        orderByClause = desc(products.createdAt);
    }

    // Get total count
    const [{ count }] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(whereClause);

    // Get products
    const result = await this.db
      .select()
      .from(products)
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    return {
      products: result,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
    };
  }

  /**
   * Get featured products
   */
  async getFeatured(limit: number = 10): Promise<Product[]> {
    return this.db
      .select()
      .from(products)
      .where(
        and(
          eq(products.status, 'active'),
          eq(products.featured, true),
          sql`${products.stockQuantity} > 0`
        )
      )
      .orderBy(desc(products.rating))
      .limit(limit);
  }

  /**
   * Get products by category
   */
  async getByCategory(categoryId: string, limit: number = 20): Promise<Product[]> {
    return this.db
      .select()
      .from(products)
      .where(
        and(
          eq(products.status, 'active'),
          eq(products.categoryId, categoryId)
        )
      )
      .orderBy(desc(products.createdAt))
      .limit(limit);
  }

  /**
   * Get products by merchant
   */
  async getByMerchant(merchantId: string, params: ProductListParams = {}): Promise<ProductListResult> {
    return this.list({ ...params, merchantId });
  }

  /**
   * Search products
   */
  async search(query: string, limit: number = 20): Promise<Product[]> {
    return this.db
      .select()
      .from(products)
      .where(
        and(
          eq(products.status, 'active'),
          sql`(
            ${products.name} ILIKE ${'%' + query + '%'} 
            OR ${products.nameAr} ILIKE ${'%' + query + '%'}
            OR ${products.description} ILIKE ${'%' + query + '%'}
          )`
        )
      )
      .orderBy(desc(products.rating))
      .limit(limit);
  }

  /**
   * Create a new product
   */
  async create(data: NewProduct): Promise<Product> {
    // Generate slug if not provided
    if (!data.slug) {
      data.slug = await this.generateUniqueSlug(data.name);
    }

    const [product] = await this.db
      .insert(products)
      .values(data)
      .returning();

    return product;
  }

  /**
   * Update a product
   */
  async update(id: string, data: Partial<NewProduct>): Promise<Product | null> {
    const [product] = await this.db
      .update(products)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();

    return product || null;
  }

  /**
   * Update product stock
   */
  async updateStock(id: string, quantity: number, operation: 'add' | 'subtract' | 'set'): Promise<Product | null> {
    let updateValue;
    
    switch (operation) {
      case 'add':
        updateValue = sql`${products.stockQuantity} + ${quantity}`;
        break;
      case 'subtract':
        updateValue = sql`GREATEST(${products.stockQuantity} - ${quantity}, 0)`;
        break;
      case 'set':
        updateValue = quantity;
        break;
    }

    const [product] = await this.db
      .update(products)
      .set({ 
        stockQuantity: updateValue as any,
        updatedAt: new Date() 
      })
      .where(eq(products.id, id))
      .returning();

    return product || null;
  }

  /**
   * Update product status
   */
  async updateStatus(id: string, status: string): Promise<Product | null> {
    const [product] = await this.db
      .update(products)
      .set({ status, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();

    return product || null;
  }

  /**
   * Delete a product (soft delete)
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.db
      .update(products)
      .set({ status: 'deleted', updatedAt: new Date() })
      .where(eq(products.id, id));

    return (result as any).rowCount > 0;
  }

  /**
   * Increment view count
   */
  async incrementViews(id: string): Promise<void> {
    await this.db
      .update(products)
      .set({ 
        viewCount: sql`${products.viewCount} + 1`
      })
      .where(eq(products.id, id));
  }

  // ============ Product Variants ============

  /**
   * Get variants for a product
   */
  async getVariants(productId: string): Promise<ProductVariant[]> {
    return this.db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, productId))
      .orderBy(asc(productVariants.price));
  }

  /**
   * Get variant by ID
   */
  async getVariantById(id: string): Promise<ProductVariant | null> {
    const [variant] = await this.db
      .select()
      .from(productVariants)
      .where(eq(productVariants.id, id))
      .limit(1);

    return variant || null;
  }

  /**
   * Create a product variant
   */
  async createVariant(data: NewProductVariant): Promise<ProductVariant> {
    const [variant] = await this.db
      .insert(productVariants)
      .values(data)
      .returning();

    return variant;
  }

  /**
   * Update a product variant
   */
  async updateVariant(id: string, data: Partial<NewProductVariant>): Promise<ProductVariant | null> {
    const [variant] = await this.db
      .update(productVariants)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(productVariants.id, id))
      .returning();

    return variant || null;
  }

  /**
   * Delete a product variant
   */
  async deleteVariant(id: string): Promise<boolean> {
    const result = await this.db
      .delete(productVariants)
      .where(eq(productVariants.id, id));

    return (result as any).rowCount > 0;
  }

  /**
   * Update variant stock
   */
  async updateVariantStock(id: string, quantity: number, operation: 'add' | 'subtract' | 'set'): Promise<ProductVariant | null> {
    let updateValue;
    
    switch (operation) {
      case 'add':
        updateValue = sql`${productVariants.stockQuantity} + ${quantity}`;
        break;
      case 'subtract':
        updateValue = sql`GREATEST(${productVariants.stockQuantity} - ${quantity}, 0)`;
        break;
      case 'set':
        updateValue = quantity;
        break;
    }

    const [variant] = await this.db
      .update(productVariants)
      .set({ 
        stockQuantity: updateValue as any,
        updatedAt: new Date() 
      })
      .where(eq(productVariants.id, id))
      .returning();

    return variant || null;
  }

  // ============ Helpers ============

  private async generateUniqueSlug(name: string): Promise<string> {
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await this.getBySlug(slug);
      if (!existing) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }
}
