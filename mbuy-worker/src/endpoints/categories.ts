/**
 * Categories Endpoints - إدارة التصنيفات
 */

import { Context } from 'hono';
import { Env } from '../types';
import { getSupabaseClient } from '../utils/supabase';

/**
 * GET /categories
 * جلب جميع التصنيفات النشطة
 */
export async function getCategories(c: Context<{ Bindings: Env }>) {
  try {
    const supabase = getSupabaseClient(c.env);
    
    // جلب التصنيفات النشطة مرتبة
    const categories = await supabase.query('categories', {
      method: 'GET',
      select: 'id, name, name_ar, slug, parent_id',
      filters: { is_active: true },
    });

    if (!categories) {
      return c.json({
        ok: false,
        code: 'CATEGORIES_FETCH_ERROR',
        message: 'Failed to fetch categories',
      }, 500);
    }

    // ترتيب التصنيفات (sort_order ثم name)
    const sortedCategories = Array.isArray(categories) 
      ? categories.sort((a: any, b: any) => {
          const sortA = a.sort_order || 999;
          const sortB = b.sort_order || 999;
          if (sortA !== sortB) return sortA - sortB;
          return (a.name || '').localeCompare(b.name || '');
        })
      : [];

    return c.json({
      ok: true,
      categories: sortedCategories,
    }, 200);
  } catch (error: any) {
    return c.json({
      ok: false,
      code: 'CATEGORIES_FETCH_ERROR',
      message: error.message || 'Failed to fetch categories',
    }, 500);
  }
}


