/**
 * Product Endpoints - إدارة المنتجات
 * جميع العمليات تعتمد على JWT و AuthContext
 * - merchants table (not user_profiles/stores)
 * - merchantId from context
 */

import { Context } from 'hono';
import { createClient } from '@supabase/supabase-js';
import { Env, SupabaseAuthContext } from '../types';
import { getSupabaseClient } from '../utils/supabase';

/**
 * POST /secure/products
 * إنشاء منتج جديد في متجر التاجر
 * Uses Supabase Auth only (Golden Plan)
 */
export async function createProduct(c: Context<{ Bindings: Env; Variables: SupabaseAuthContext }>) {
  try {
    console.warn('⚠️ WARNING: Using OLD createProduct endpoint (products.ts). This should be products-new.ts!');
    // ============================================
    // الخطوة 1: Get Auth Context (Supabase Auth only)
    // ============================================
    console.log('==============================================');
    console.log('STEP 1: Getting Auth Context from Middleware');
    console.log('==============================================');
    
    const profileId = c.get('profileId') as string;
    const userRole = c.get('userRole') as string;

    if (!profileId) {
      console.error('[createProduct] Missing auth context');
      return c.json({
        ok: false,
        error: 'unauthorized',
        message: 'Authentication required',
      }, 401);
    }

    // التحقق من دور المستخدم
    if (userRole !== 'merchant' && userRole !== 'admin') {
      console.error('[createProduct] User is not merchant:', userRole);
      return c.json({
        ok: false,
        error: 'forbidden',
        message: 'Only merchants can create products',
      }, 403);
    }

    // ============================================
    // الخطوة 3: الحصول على merchantId من context
    // ============================================
    const supabase = getSupabaseClient(c.env);

    // جلب merchantId من context (supports both old and new auth)
    const storeId = c.get('storeId') as string;
    const contextMerchantId = c.get('merchantId') as string;
    const merchantId = contextMerchantId || storeId;

    if (!merchantId) {
      console.error('[createProduct] No merchantId found in context');
      return c.json({
        ok: false,
        error: 'no_store',
        message: 'يجب إنشاء متجر أولاً قبل إضافة المنتجات. يرجى الانتقال إلى صفحة المتجر وإنشاء متجر جديد.',
      }, 400);
    }

    console.log('[createProduct] merchantId from context:', merchantId);

    // قراءة البيانات من الطلب
    const body = await c.req.json();
    console.log('==============================================');
    console.log('STEP 1: Request Body Received');
    console.log('==============================================');
    console.log('Body:', JSON.stringify(body, null, 2));
    
    const { name, description, price, category_id, stock, image_url, media, extra_data } = body;

    // التحقق من البيانات المطلوبة
    if (!name || name.trim() === '') {
      return c.json({
        ok: false,
        code: 'VALIDATION_ERROR',
        message: 'Product name is required',
      }, 400);
    }

    if (!price || price <= 0) {
      return c.json({
        ok: false,
        code: 'VALIDATION_ERROR',
        message: 'Valid price is required',
      }, 400);
    }

    // التحقق من وجود category_id
    if (!category_id) {
      return c.json({
        ok: false,
        code: 'CATEGORY_REQUIRED',
        message: 'Category is required',
      }, 400);
    }

    // التحقق من أن category_id موجود وفعّال
    const category = await supabase.query('product_categories', {
      method: 'GET',
      select: 'id',
      filters: { id: category_id, is_active: true },
      single: true,
    });

    if (!category) {
      console.error('[createProduct] Category not found:', category_id);
      return c.json({
        ok: false,
        error: 'category_not_found',
        message: 'Selected category does not exist',
      }, 400);
    }

    // البحث عن الصورة الرئيسية من media array
    let mainImageUrl = image_url || null;
    if (media && Array.isArray(media) && media.length > 0) {
      const mainMedia = media.find((m: any) => m.type === 'image' && m.is_main === true);
      if (mainMedia) {
        mainImageUrl = mainMedia.url;
      } else {
        // إذا لم توجد صورة رئيسية، استخدم أول صورة
        const firstImage = media.find((m: any) => m.type === 'image');
        if (firstImage) {
          mainImageUrl = firstImage.url;
        }
      }
    }

    // ============================================
    // الخطوة 5: بناء object المنتج بالأعمدة الصحيحة فقط
    // ============================================
    const product = {
      merchant_id: merchantId,  // ✅ من context
      category_id: category_id,
      name: name.trim(),
      description: description || '',
      price: parseFloat(price),
      stock: stock !== undefined ? parseInt(stock, 10) : 0,
      main_image_url: mainImageUrl,
      is_active: true,
      extra_data: extra_data || {},
    };

    console.log('==============================================');
    console.log('STEP 4: Final Product Payload');
    console.log('==============================================');
    console.log('Product Payload:', JSON.stringify(product, null, 2));
    console.log('store_id value:', merchantId);
    console.log('store_id type:', typeof merchantId);
    console.log('store_id is null?', merchantId === null);
    console.log('store_id is undefined?', merchantId === undefined);

    // ============================================
    // الخطوة 6: تنفيذ الإدراج
    // ============================================
    console.log('==============================================');
    console.log('STEP 5: Inserting Product into Database');
    console.log('==============================================');
    
    let newProduct;
    try {
      newProduct = await supabase.insert('products', product);
      
      if (!newProduct) {
        console.error('❌ INSERT FAILED - Supabase returned null/undefined');
        console.error('Product payload was:', JSON.stringify(product, null, 2));
        return c.json({
          ok: false,
          error: 'database_error',
          message: 'Failed to create product - insert returned null',
        }, 500);
      }
      
      console.log('✅ INSERT SUCCESS');
      console.log('New Product:', JSON.stringify(newProduct, null, 2));
      
    } catch (insertError: any) {
      console.error('==============================================');
      console.error('❌ INSERT ERROR - Exception Caught');
      console.error('==============================================');
      console.error('Error Message:', insertError.message || 'Unknown error');
      console.error('Error Code:', insertError.code || 'N/A');
      console.error('Error Details:', insertError.details || 'N/A');
      console.error('Error Hint:', insertError.hint || 'N/A');
      console.error('Full Error Object:', JSON.stringify(insertError, null, 2));
      console.error('Product payload was:', JSON.stringify(product, null, 2));
      
      return c.json({
        ok: false,
        error: 'database_error',
        message: insertError.message || 'Failed to create product',
        details: {
          code: insertError.code,
          hint: insertError.hint,
          details: insertError.details,
        },
      }, 500);
    }

    console.log('[createProduct] Product created successfully:', newProduct.id);

    // ============================================
    // الخطوة 7: إدخال سجلات product_media إذا وجدت
    // ============================================
    if (media && Array.isArray(media) && media.length > 0) {
      console.log('[createProduct] Inserting media items:', media.length);
      console.log('[createProduct] Media data:', JSON.stringify(media, null, 2));
      
      for (const mediaItem of media) {
        const { type, url, is_main, sort_order } = mediaItem;
        
        if (!type || !url) {
          console.warn('[createProduct] Skipping invalid media item:', mediaItem);
          continue;
        }

        const mediaRecord = {
          product_id: newProduct.id,
          media_type: type,  // 'image' أو 'video'
          url: url,
          sort_order: sort_order !== undefined ? sort_order : 0,
          is_main: is_main === true,
        };
        
        console.log('[createProduct] Inserting media record:', JSON.stringify(mediaRecord, null, 2));

        try {
          const insertedMedia = await supabase.insert('product_media', mediaRecord);
          console.log('[createProduct] ✅ Media item inserted successfully:', insertedMedia);
        } catch (mediaError: any) {
          console.error('[createProduct] ❌ Error inserting product_media:', {
            error: mediaError.message || mediaError,
            record: mediaRecord,
          });
          // لا نوقف العملية، فقط نسجل الخطأ
        }
      }
    }

    // ============================================
    // الخطوة 8: إعادة جلب المنتج مع product_media
    // ============================================
    console.log('[createProduct] Fetching product with media...');
    
    // استخدام query مباشر بدلاً من findByColumn
    // الطريقة الأولى: جلب المنتج ومنفصل جلب media
    const productWithMedia = await supabase.findByColumn('products', 'id', newProduct.id);
    
    if (productWithMedia) {
      // جلب جميع media items المرتبطة بهذا المنتج
      const mediaItems = await supabase.query('product_media', {
        method: 'GET',
        filters: { product_id: newProduct.id },
      });
      
      // دمج media items مع product
      (productWithMedia as any).product_media = mediaItems;
      
      console.log('[createProduct] ✅ Product fetched successfully');
      console.log('[createProduct] Media items count:', mediaItems?.length || 0);
      console.log('[createProduct] Media items:', JSON.stringify(mediaItems, null, 2));
    }

    // ============================================
    // الخطوة 9: إرجاع المنتج الجديد
    // ============================================
    console.log('[createProduct] Success - returning product with media');
    return c.json({
      ok: true,
      product_id: newProduct.id,
      code: 'PRODUCT_CREATED',
      data: productWithMedia || newProduct,
    }, 201);

  } catch (error: any) {
    console.error('[createProduct] Unexpected error:', error);
    return c.json({
      ok: false,
      error: 'internal_error',
      message: error.message || 'Internal server error',
    }, 500);
  }
}

/**
 * PUT /secure/products/:id
 * تحديث منتج موجود
 */
export async function updateProduct(c: Context<{ Bindings: Env; Variables: SupabaseAuthContext }>) {
  try {
    // 1. Get Auth Context from middleware
    const profileId = c.get('profileId') as string;
    const userRole = c.get('userRole') as string;

    if (!profileId) {
      return c.json({
        ok: false,
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      }, 401);
    }

    // 2. الحصول على product_id من URL
    const productId = c.req.param('id');

    if (!productId) {
      return c.json({
        ok: false,
        code: 'VALIDATION_ERROR',
        message: 'Product ID is required',
      }, 400);
    }

    // 3. التحقق من ملكية المنتج
    const supabase = getSupabaseClient(c.env);

    const product = await supabase.findById('products', productId, 'id, merchant_id');

    if (!product) {
      return c.json({
        ok: false,
        code: 'PRODUCT_NOT_FOUND',
        message: 'Product not found',
      }, 404);
    }

    // جلب merchantId من context
    const storeId = c.get('storeId') as string;
    const contextMerchantId = c.get('merchantId') as string;
    const merchantId = contextMerchantId || storeId;

    // التحقق من ملكية المنتج
    if (product.merchant_id !== merchantId && userRole !== 'admin') {
      return c.json({
        ok: false,
        code: 'FORBIDDEN',
        message: 'You do not own this product',
      }, 403);
    }

    // 4. قراءة البيانات من الطلب
    const body = await c.req.json();
    const { name, description, price, category_id, stock, images, is_active, extra_data } = body;

    // 5. تحديث المنتج
    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description;
    if (price !== undefined && price > 0) updateData.price = parseFloat(price);
    if (category_id) updateData.category_id = category_id;
    if (stock !== undefined) updateData.stock = parseInt(stock, 10);
    if (images !== undefined) updateData.images = images;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (extra_data !== undefined) updateData.extra_data = extra_data;
    updateData.updated_at = new Date().toISOString();

    const updatedProduct = await supabase.update('products', productId, updateData);

    if (!updatedProduct) {
      return c.json({
        ok: false,
        code: 'DATABASE_ERROR',
        message: 'Failed to update product',
      }, 500);
    }

    // 6. إرجاع المنتج المحدث
    return c.json({
      ok: true,
      data: updatedProduct,
    }, 200);

  } catch (error: any) {
    return c.json({
      ok: false,
      code: 'INTERNAL_ERROR',
      message: error.message || 'Internal server error',
    }, 500);
  }
}

/**
 * DELETE /secure/products/:id
 * حذف منتج (soft delete)
 * Uses Supabase Auth only (Golden Plan)
 */
export async function deleteProduct(c: Context<{ Bindings: Env; Variables: SupabaseAuthContext }>) {
  try {
    // 1. Get Auth Context from middleware
    const profileId = c.get('profileId') as string;
    const userRole = c.get('userRole') as string;

    if (!profileId) {
      return c.json({
        ok: false,
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      }, 401);
    }

    // 2. الحصول على product_id من URL
    const productId = c.req.param('id');

    if (!productId) {
      return c.json({
        ok: false,
        code: 'VALIDATION_ERROR',
        message: 'Product ID is required',
      }, 400);
    }

    // 3. التحقق من ملكية المنتج
    const supabase = getSupabaseClient(c.env);

    const product = await supabase.findById('products', productId, 'id, merchant_id');

    if (!product) {
      return c.json({
        ok: false,
        code: 'PRODUCT_NOT_FOUND',
        message: 'Product not found',
      }, 404);
    }

    // جلب merchantId من context
    const storeId = c.get('storeId') as string;
    const contextMerchantId = c.get('merchantId') as string;
    const merchantId = contextMerchantId || storeId;

    // التحقق من ملكية المنتج
    if (product.merchant_id !== merchantId && userRole !== 'admin') {
      return c.json({
        ok: false,
        code: 'FORBIDDEN',
        message: 'You do not own this product',
      }, 403);
    }

    // 4. حذف المنتج (soft delete)
    await supabase.update('products', productId, { is_active: false, updated_at: new Date().toISOString() });

    // 5. إرجاع نجاح العملية
    return c.json({
      ok: true,
      message: 'Product deleted successfully',
    }, 200);

  } catch (error: any) {
    return c.json({
      ok: false,
      code: 'INTERNAL_ERROR',
      message: error.message || 'Internal server error',
    }, 500);
  }
}

/**
 * GET /secure/products
 * جلب جميع منتجات متجر التاجر
 * Uses Supabase Auth only (Golden Plan)
 */
export async function getMerchantProducts(c: Context<{ Bindings: Env; Variables: SupabaseAuthContext }>) {
  try {
    // 1. Get Auth Context from middleware
    const profileId = c.get('profileId') as string;
    const userRole = c.get('userRole') as string;

    if (!profileId) {
      return c.json({
        ok: false,
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      }, 401);
    }

    // 2. التحقق من أن المستخدم merchant
    if (userRole !== 'merchant' && userRole !== 'admin') {
      return c.json({
        ok: false,
        code: 'FORBIDDEN',
        message: 'Only merchants can access their products',
      }, 403);
    }

    // 3. إنشاء عميل Supabase (Service Role لتجاوز RLS)
    const supabaseUrl = c.env.SUPABASE_URL;
    const serviceKey = (c.env as any).SUPABASE_SERVICE_ROLE_KEY || (c.env as any).SUPABASE_SERVICE_KEY;
    
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 4. جلب merchantId من context
    const storeId = c.get('storeId') as string;
    const contextMerchantId = c.get('merchantId') as string;
    const merchantId = contextMerchantId || storeId;

    if (!merchantId) {
      return c.json({ ok: false, error: 'no_store', message: 'Store not found. Please create a store first.' }, 400);
    }

    console.log('[getMerchantProducts] Using merchantId from context:', merchantId);

    // 5. جلب منتجات المتجر مع الوسائط
    console.log('[getMerchantProducts] Fetching products first');
    
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('merchant_id', merchantId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (productsError) {
      console.error('Failed to fetch products:', productsError);
      return c.json({ ok: false, error: 'database_error', message: 'Failed to fetch products' }, 500);
    }

    // جلب الوسائط لكل منتج
    if (products && products.length > 0) {
      console.log('[getMerchantProducts] Fetching media for products');
      
      for (const product of products) {
        console.log(`[getMerchantProducts] Fetching media for product: ${product.id}`);
        
        const { data: media, error: mediaError } = await supabase
          .from('product_media')
          .select('*')
          .eq('product_id', product.id)
          .order('sort_order', { ascending: true });

        if (mediaError) {
          console.error(`[getMerchantProducts] Failed to fetch media for product ${product.id}:`, mediaError);
          product.product_media = [];
        } else {
          product.product_media = media || [];
          console.log(`[getMerchantProducts] Product ${product.id} has ${product.product_media.length} media items`);
          if (product.product_media.length > 0) {
            console.log(`[getMerchantProducts] Media details:`, JSON.stringify(product.product_media, null, 2));
          }
        }
      }
    }

    console.log('[getMerchantProducts] Products fetched:', products?.length || 0);
    if (products && products.length > 0) {
      console.log('[getMerchantProducts] First product product_media:', products[0].product_media);
      console.log('[getMerchantProducts] First product media count:', products[0].product_media?.length || 0);
    }

    // 6. إرجاع المنتجات
    return c.json({
      ok: true,
      data: products || [],
    }, 200);

  } catch (error: any) {
    console.error('Unexpected error in getMerchantProducts:', error);
    return c.json({
      ok: false,
      code: 'INTERNAL_ERROR',
      message: error.message || 'Internal server error',
    }, 500);
  }
}


