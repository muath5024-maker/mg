/**
 * Flash Sales System Endpoints
 * نظام العروض الخاطفة
 */

import { Context } from 'hono';
import { Env, SupabaseAuthContext } from '../types';

type FlashSalesContext = Context<{ Bindings: Env; Variables: SupabaseAuthContext & { merchantId?: string } }>;

// ============================================================================
// Get All Flash Sales
// ============================================================================

export async function getFlashSales(c: FlashSalesContext) {
  try {
    const merchantId = c.get('merchantId') as string;
    
    if (!merchantId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/flash_sales?merchant_id=eq.${merchantId}&order=created_at.desc`,
      {
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    const flashSales = await response.json();

    // Get products for each flash sale
    for (const sale of flashSales as any[]) {
      const productsResponse = await fetch(
        `${c.env.SUPABASE_URL}/rest/v1/flash_sale_products?flash_sale_id=eq.${sale.id}&select=*,products(id,name,name_ar,image_url)`,
        {
          headers: {
            'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
            'Content-Type': 'application/json',
          },
        }
      );
      sale.flash_sale_products = await productsResponse.json();
    }

    return c.json({ ok: true, data: flashSales });
  } catch (error: any) {
    console.error('Get flash sales error:', error);
    return c.json({ ok: false, error: 'فشل في جلب العروض' }, 500);
  }
}

// ============================================================================
// Get Single Flash Sale
// ============================================================================

export async function getFlashSale(c: FlashSalesContext) {
  try {
    const id = c.req.param('id');
    const merchantId = c.get('merchantId') as string;

    if (!merchantId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/flash_sales?id=eq.${id}&merchant_id=eq.${merchantId}`,
      {
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    const sales = await response.json() as any[];
    if (!sales || sales.length === 0) {
      return c.json({ ok: false, error: 'Flash sale not found' }, 404);
    }

    const sale = sales[0];

    // Get products
    const productsResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/flash_sale_products?flash_sale_id=eq.${sale.id}&select=*,products(id,name,name_ar,image_url,price)`,
      {
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    sale.flash_sale_products = await productsResponse.json();

    return c.json({ ok: true, data: sale });
  } catch (error: any) {
    console.error('Get flash sale error:', error);
    return c.json({ ok: false, error: 'فشل في جلب العرض' }, 500);
  }
}

// ============================================================================
// Create Flash Sale
// ============================================================================

export async function createFlashSale(c: FlashSalesContext) {
  try {
    const merchantId = c.get('merchantId') as string;
    const body = await c.req.json();

    if (!merchantId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    const {
      title,
      title_ar,
      description,
      description_ar,
      cover_image,
      starts_at,
      ends_at,
      default_discount_type,
      default_discount_value,
      max_orders,
      is_featured,
      products
    } = body;

    if (!title || !starts_at || !ends_at) {
      return c.json({ ok: false, error: 'Missing required fields' }, 400);
    }

    // Determine status based on timing
    const now = new Date();
    const startDate = new Date(starts_at);
    const endDate = new Date(ends_at);
    
    let status = 'draft';
    if (startDate <= now && endDate > now) {
      status = 'active';
    } else if (startDate > now) {
      status = 'scheduled';
    }

    // Create flash sale
    const createResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/flash_sales`,
      {
        method: 'POST',
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          store_id: merchantId,
          title,
          title_ar: title_ar || title,
          description,
          description_ar,
          cover_image,
          starts_at,
          ends_at,
          default_discount_type: default_discount_type || 'percentage',
          default_discount_value,
          max_orders,
          is_featured: is_featured || false,
          status
        }),
      }
    );

    const flashSales = await createResponse.json() as any[];
    const flashSale = flashSales[0];

    // Add products if provided
    if (products && products.length > 0) {
      const flashProducts = products.map((p: any, index: number) => ({
        flash_sale_id: flashSale.id,
        product_id: p.product_id,
        store_id: merchantId,
        original_price: p.original_price,
        sale_price: p.sale_price,
        quantity_limit: p.quantity_limit,
        sort_order: index
      }));

      await fetch(
        `${c.env.SUPABASE_URL}/rest/v1/flash_sale_products`,
        {
          method: 'POST',
          headers: {
            'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(flashProducts),
        }
      );
    }

    return c.json({ ok: true, data: flashSale });
  } catch (error: any) {
    console.error('Create flash sale error:', error);
    return c.json({ ok: false, error: 'فشل في إنشاء العرض' }, 500);
  }
}

// ============================================================================
// Update Flash Sale
// ============================================================================

export async function updateFlashSale(c: FlashSalesContext) {
  try {
    const id = c.req.param('id');
    const merchantId = c.get('merchantId') as string;
    const body = await c.req.json();

    if (!merchantId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/flash_sales?id=eq.${id}&merchant_id=eq.${merchantId}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(body),
      }
    );

    const sales = await response.json() as any[];
    if (!sales || sales.length === 0) {
      return c.json({ ok: false, error: 'Flash sale not found' }, 404);
    }

    return c.json({ ok: true, data: sales[0] });
  } catch (error: any) {
    console.error('Update flash sale error:', error);
    return c.json({ ok: false, error: 'فشل في تحديث العرض' }, 500);
  }
}

// ============================================================================
// Delete Flash Sale
// ============================================================================

export async function deleteFlashSale(c: FlashSalesContext) {
  try {
    const id = c.req.param('id');
    const merchantId = c.get('merchantId') as string;

    if (!merchantId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/flash_sales?id=eq.${id}&merchant_id=eq.${merchantId}`,
      {
        method: 'DELETE',
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    return c.json({ ok: true });
  } catch (error: any) {
    console.error('Delete flash sale error:', error);
    return c.json({ ok: false, error: 'فشل في حذف العرض' }, 500);
  }
}

// ============================================================================
// Add Products to Flash Sale
// ============================================================================

export async function addFlashSaleProducts(c: FlashSalesContext) {
  try {
    const id = c.req.param('id');
    const merchantId = c.get('merchantId') as string;
    const { products } = await c.req.json();

    if (!merchantId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    const flashProducts = products.map((p: any, index: number) => ({
      flash_sale_id: id,
      product_id: p.product_id,
      store_id: merchantId,
      original_price: p.original_price,
      sale_price: p.sale_price,
      quantity_limit: p.quantity_limit,
      sort_order: index
    }));

    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/flash_sale_products`,
      {
        method: 'POST',
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(flashProducts),
      }
    );

    const data = await response.json();
    return c.json({ ok: true, data });
  } catch (error: any) {
    console.error('Add flash sale products error:', error);
    return c.json({ ok: false, error: 'فشل في إضافة المنتجات' }, 500);
  }
}

// ============================================================================
// Remove Product from Flash Sale
// ============================================================================

export async function removeFlashSaleProduct(c: FlashSalesContext) {
  try {
    const id = c.req.param('id');
    const productId = c.req.param('productId');
    const merchantId = c.get('merchantId') as string;

    if (!merchantId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/flash_sale_products?flash_sale_id=eq.${id}&product_id=eq.${productId}&merchant_id=eq.${merchantId}`,
      {
        method: 'DELETE',
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    return c.json({ ok: true });
  } catch (error: any) {
    console.error('Remove flash sale product error:', error);
    return c.json({ ok: false, error: 'فشل في إزالة المنتج' }, 500);
  }
}

// ============================================================================
// Activate Flash Sale
// ============================================================================

export async function activateFlashSale(c: FlashSalesContext) {
  try {
    const id = c.req.param('id');
    const merchantId = c.get('merchantId') as string;

    if (!merchantId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/flash_sales?id=eq.${id}&merchant_id=eq.${merchantId}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({ status: 'active' }),
      }
    );

    const sales = await response.json() as any[];
    return c.json({ ok: true, data: sales[0] });
  } catch (error: any) {
    console.error('Activate flash sale error:', error);
    return c.json({ ok: false, error: 'فشل في تفعيل العرض' }, 500);
  }
}

// ============================================================================
// Get Public Flash Sales (for customers)
// ============================================================================

export async function getPublicFlashSales(c: FlashSalesContext) {
  try {
    const merchantId = c.req.param('merchantId');
    const now = new Date().toISOString();

    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/flash_sales?merchant_id=eq.${merchantId}&status=eq.active&starts_at=lte.${now}&ends_at=gte.${now}&order=is_featured.desc`,
      {
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    const flashSales = await response.json() as any[];

    // Get products for each flash sale
    for (const sale of flashSales) {
      const productsResponse = await fetch(
        `${c.env.SUPABASE_URL}/rest/v1/flash_sale_products?flash_sale_id=eq.${sale.id}&select=*,products(id,name,name_ar,image_url)`,
        {
          headers: {
            'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
            'Content-Type': 'application/json',
          },
        }
      );
      sale.flash_sale_products = await productsResponse.json();
    }

    return c.json({ ok: true, data: flashSales });
  } catch (error: any) {
    console.error('Get public flash sales error:', error);
    return c.json({ ok: false, error: 'فشل في جلب العروض' }, 500);
  }
}


