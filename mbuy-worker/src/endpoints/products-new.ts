/**
 * Product Creation - Clean & Production Ready Implementation
 */

import { Context } from 'hono';
import { createClient } from '@supabase/supabase-js';
import { Env, SupabaseAuthContext } from '../types';

/**
 * إنشاء منتج جديد
 * POST /secure/products
 */
export async function createProductForCurrentMerchant(
  c: Context<{ Bindings: Env; Variables: SupabaseAuthContext }>
) {
  try {
    console.log('[createProduct] Starting product creation...');

    // 1. التحقق من الصلاحيات
    const profileId = c.get('profileId') as string;
    const userRole = c.get('userRole') as string;

    if (!profileId) {
      return c.json({ ok: false, error: 'unauthorized', message: 'Authentication required' }, 401);
    }

    if (userRole !== 'merchant' && userRole !== 'admin') {
      return c.json({ ok: false, error: 'forbidden', message: 'Only merchants can create products' }, 403);
    }

    // 2. إنشاء عميل Supabase (Service Role لتجاوز RLS أثناء القراءة)
    // نستخدم createClient مباشرة لأن getSupabaseClient يرجع كائن مخصص لا يدعم .from()
    const supabaseUrl = c.env.SUPABASE_URL;
    const serviceKey = (c.env as any).SUPABASE_SERVICE_ROLE_KEY || (c.env as any).SUPABASE_SERVICE_KEY;
    
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 3. جلب merchantId من context
    const storeId = c.get('storeId') as string;
    const contextMerchantId = c.get('merchantId') as string;
    const merchantId = contextMerchantId || storeId;

    if (!merchantId) {
      return c.json({ ok: false, error: 'no_store', message: 'Store not found. Please create a store first.' }, 400);
    }

    console.log('[createProduct] Using merchantId from context:', merchantId);

    // 4. قراءة وتنظيف البيانات
    const rawBody = await c.req.json();
    console.log('[createProduct] Received body:', JSON.stringify({ ...rawBody, media: rawBody.media?.length }));
    
    // التحقق من البيانات الأساسية
    if (!rawBody.name?.trim()) {
      return c.json({ ok: false, error: 'validation_error', message: 'Product name is required' }, 400);
    }
    if (!rawBody.price || rawBody.price <= 0) {
      return c.json({ ok: false, error: 'validation_error', message: 'Valid price is required' }, 400);
    }
    if (!rawBody.category_id) {
      return c.json({ ok: false, error: 'validation_error', message: 'Category is required' }, 400);
    }

    // تحديد الصورة الرئيسية
    let mainImageUrl = rawBody.image_url || rawBody.main_image_url || null;
    if (rawBody.media && Array.isArray(rawBody.media) && rawBody.media.length > 0) {
      const mainMedia = rawBody.media.find((m: any) => m.type === 'image' && m.is_main === true);
      mainImageUrl = mainMedia ? mainMedia.url : (rawBody.media.find((m: any) => m.type === 'image')?.url || mainImageUrl);
    }

    // استخراج platform_category_id من extra_data إذا لم يكن موجوداً في المستوى الأول
    const platformCategoryId = rawBody.platform_category_id || rawBody.extra_data?.platform_category_id || null;

    // تجهيز كائن المنتج
    const productToInsert: Record<string, any> = {
      merchant_id: merchantId,
      category_id: rawBody.category_id,
      name: rawBody.name.trim(),
      description: rawBody.description || '',
      price: parseFloat(rawBody.price),
      stock: rawBody.stock ? parseInt(rawBody.stock, 10) : 0,
      main_image_url: mainImageUrl,
      is_active: rawBody.is_active ?? true,
    };

    // إضافة platform_category_id إذا كان موجوداً
    if (platformCategoryId) {
      productToInsert.platform_category_id = platformCategoryId;
    }

    // 5. إدخال المنتج
    const { data: newProduct, error: insertError } = await supabase
      .from('products')
      .insert(productToInsert)
      .select()
      .single();

    if (insertError) {
      console.error('[createProduct] Product insert failed:', insertError);
      return c.json({
        ok: false,
        error: 'insert_failed',
        message: insertError.message,
        details: insertError.details
      }, 400);
    }

    console.log('[createProduct] Product created:', newProduct.id);

    // 6. إدخال الوسائط (Media) إن وجدت
    if (rawBody.media && Array.isArray(rawBody.media) && rawBody.media.length > 0) {
      console.log('[createProduct] Processing media items:', rawBody.media.length);
      
      const mediaItems = rawBody.media
        .filter((m: any) => m.type && m.url)
        .map((m: any, index: number) => ({
          product_id: newProduct.id,
          media_type: m.type,
          url: m.url,
          is_main: m.is_main || false,
          sort_order: m.sort_order ?? index
        }));

      console.log('[createProduct] Prepared media items:', JSON.stringify(mediaItems));

      if (mediaItems.length > 0) {
        const { data: insertedMedia, error: mediaError } = await supabase
          .from('product_media')
          .insert(mediaItems)
          .select();
        
        if (mediaError) {
          console.error('[createProduct] Media insert failed:', mediaError);
          // لا نرجع خطأ هنا لأن المنتج تم إنشاؤه بالفعل
        } else {
          console.log('[createProduct] Media inserted successfully:', insertedMedia?.length);
          
          // Return debug info
          return c.json({ 
            ok: true, 
            data: {
              ...newProduct,
              product_media: insertedMedia || []
            },
            debug: {
                mediaReceived: rawBody.media?.length,
                mediaPrepared: mediaItems.length,
                mediaInserted: insertedMedia?.length
            }
          }, 201);
        }
      }
    }

    return c.json({ 
      ok: true, 
      data: {
        ...newProduct,
        product_media: []
      }
    }, 201);

  } catch (error: any) {
    console.error('[createProduct] Unexpected error:', error);
    return c.json({ ok: false, error: 'internal_error', message: 'An unexpected error occurred' }, 500);
  }
}


