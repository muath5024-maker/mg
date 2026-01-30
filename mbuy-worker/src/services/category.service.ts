/**
 * Category Service
 * Handles category-related business logic
 */

import { eq, and, isNull, desc, asc, sql } from 'drizzle-orm';
import type { Database } from '../db';
import type { Env } from '../types';
import { categories, type Category, type NewCategory } from '../db/schema/categories';

export interface CategoryTree extends Category {
  children: CategoryTree[];
}

export class CategoryService {
  constructor(
    private db: Database,
    private env: Env
  ) {}

  /**
   * Get category by ID
   */
  async getById(id: string): Promise<Category | null> {
    const [category] = await this.db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);

    return category || null;
  }

  /**
   * Get category by slug
   */
  async getBySlug(slug: string): Promise<Category | null> {
    const [category] = await this.db
      .select()
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1);

    return category || null;
  }

  /**
   * Get all categories
   */
  async getAll(): Promise<Category[]> {
    return this.db
      .select()
      .from(categories)
      .where(eq(categories.status, 'active'))
      .orderBy(asc(categories.sortOrder), asc(categories.name));
  }

  /**
   * Get root categories (no parent)
   */
  async getRootCategories(): Promise<Category[]> {
    return this.db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.status, 'active'),
          isNull(categories.parentId)
        )
      )
      .orderBy(asc(categories.sortOrder), asc(categories.name));
  }

  /**
   * Get subcategories
   */
  async getSubcategories(parentId: string): Promise<Category[]> {
    return this.db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.status, 'active'),
          eq(categories.parentId, parentId)
        )
      )
      .orderBy(asc(categories.sortOrder), asc(categories.name));
  }

  /**
   * Get category tree (hierarchical structure)
   */
  async getTree(): Promise<CategoryTree[]> {
    const allCategories = await this.getAll();
    return this.buildTree(allCategories, null);
  }

  /**
   * Get category path (breadcrumb)
   */
  async getPath(categoryId: string): Promise<Category[]> {
    const path: Category[] = [];
    let currentId: string | null = categoryId;

    while (currentId) {
      const category = await this.getById(currentId);
      if (!category) break;
      path.unshift(category);
      currentId = category.parentId;
    }

    return path;
  }

  /**
   * Get all descendant category IDs
   */
  async getDescendantIds(categoryId: string): Promise<string[]> {
    const ids: string[] = [categoryId];
    const children = await this.getSubcategories(categoryId);
    
    for (const child of children) {
      const descendantIds = await this.getDescendantIds(child.id);
      ids.push(...descendantIds);
    }

    return ids;
  }

  /**
   * Create a new category
   */
  async create(data: NewCategory): Promise<Category> {
    // Generate slug if not provided
    if (!data.slug) {
      data.slug = await this.generateUniqueSlug(data.name);
    }

    // Calculate level
    if (data.parentId) {
      const parent = await this.getById(data.parentId);
      if (parent) {
        data.level = parent.level + 1;
      }
    } else {
      data.level = 0;
    }

    const [category] = await this.db
      .insert(categories)
      .values(data)
      .returning();

    return category;
  }

  /**
   * Update a category
   */
  async update(id: string, data: Partial<NewCategory>): Promise<Category | null> {
    // Recalculate level if parent changed
    if (data.parentId !== undefined) {
      if (data.parentId) {
        const parent = await this.getById(data.parentId);
        if (parent) {
          data.level = parent.level + 1;
        }
      } else {
        data.level = 0;
      }
    }

    const [category] = await this.db
      .update(categories)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();

    // Update children levels if parent changed
    if (category && data.parentId !== undefined) {
      await this.updateChildrenLevels(id, category.level);
    }

    return category || null;
  }

  /**
   * Delete a category
   */
  async delete(id: string): Promise<boolean> {
    // Check for children
    const children = await this.getSubcategories(id);
    if (children.length > 0) {
      throw new Error('Cannot delete category with subcategories');
    }

    // Check for products
    const [{ count }] = await this.db.execute<{ count: number }>(sql`
      SELECT COUNT(*)::int as count FROM products WHERE category_id = ${id}
    `);

    if (count > 0) {
      throw new Error('Cannot delete category with products');
    }

    const result = await this.db
      .delete(categories)
      .where(eq(categories.id, id));

    return (result as any).rowCount > 0;
  }

  /**
   * Soft delete - deactivate category
   */
  async deactivate(id: string): Promise<Category | null> {
    const [category] = await this.db
      .update(categories)
      .set({ status: 'inactive', updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();

    return category || null;
  }

  /**
   * Update sort order
   */
  async updateSortOrder(items: { id: string; sortOrder: number }[]): Promise<void> {
    for (const item of items) {
      await this.db
        .update(categories)
        .set({ sortOrder: item.sortOrder, updatedAt: new Date() })
        .where(eq(categories.id, item.id));
    }
  }

  /**
   * Get category statistics
   */
  async getStats(id: string): Promise<{
    productCount: number;
    subcategoryCount: number;
    totalProductCount: number;
  }> {
    // Direct product count
    const [productStats] = await this.db.execute<{ count: number }>(sql`
      SELECT COUNT(*)::int as count 
      FROM products 
      WHERE category_id = ${id} AND status = 'active'
    `);

    // Subcategory count
    const [subcategoryStats] = await this.db.execute<{ count: number }>(sql`
      SELECT COUNT(*)::int as count 
      FROM categories 
      WHERE parent_id = ${id} AND is_active = true
    `);

    // Total product count (including subcategories)
    const descendantIds = await this.getDescendantIds(id);
    const [totalProductStats] = await this.db.execute<{ count: number }>(sql`
      SELECT COUNT(*)::int as count 
      FROM products 
      WHERE category_id = ANY(${descendantIds}::uuid[]) AND status = 'active'
    `);

    return {
      productCount: productStats?.count || 0,
      subcategoryCount: subcategoryStats?.count || 0,
      totalProductCount: totalProductStats?.count || 0,
    };
  }

  // ============ Helpers ============

  private buildTree(categories: Category[], parentId: string | null): CategoryTree[] {
    return categories
      .filter(c => c.parentId === parentId)
      .map(c => ({
        ...c,
        children: this.buildTree(categories, c.id),
      }));
  }

  private async updateChildrenLevels(parentId: string, parentLevel: number): Promise<void> {
    const children = await this.getSubcategories(parentId);
    
    for (const child of children) {
      await this.db
        .update(categories)
        .set({ level: parentLevel + 1, updatedAt: new Date() })
        .where(eq(categories.id, child.id));
      
      await this.updateChildrenLevels(child.id, parentLevel + 1);
    }
  }

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
