/**
 * Dropshipping Endpoints
 * نظام دروب شوبينق بين تجار المنصة
 *
 * Updated to use new schema:
 * - merchants table instead of stores
 * - merchantId from context instead of user_profiles.store_id
 */

import { Context } from 'hono';
import { createClient } from '@supabase/supabase-js';
import { Env, SupabaseAuthContext, AuthContext } from '../types';
import { logInfo, logError } from '../utils/logging';

/**
 * Helper: Create Supabase client
 */
function getSupabaseClient(env: Env) {
  const supabaseUrl = env.SUPABASE_URL;
  const serviceKey = (env as any).SUPABASE_SERVICE_ROLE_KEY || (env as any).SUPABASE_SERVICE_KEY;
  return createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

/**
 * Helper: Get merchant ID from context (supports both old and new auth)
 */
function getMerchantId(c: Context<{ Bindings: Env; Variables: SupabaseAuthContext }>): string | null {
  // Try new AuthContext first
  const merchantId = c.get('merchantId') as string | undefined;
  if (merchantId) return merchantId;

  // Fallback to old SupabaseAuthContext
  const storeId = c.get('storeId') as string | undefined;
  if (storeId) return storeId;

  return null;
}

/**
 * ========================================
 * SUPPLIER ENDPOINTS
 * ========================================
 */

/**
 * POST /secure/dropship/products
 * إنشاء منتج دروب شوبينق جديد
 */
export async function createDropshipProduct(c: Context<{ Bindings: Env; Variables: SupabaseAuthContext }>) {
  try {
    const userRole = c.get('userRole') as string;

    if (userRole !== 'merchant' && userRole !== 'admin') {
      return c.json({ ok: false, error: 'forbidden', message: 'Only merchants can create dropship products' }, 403);
    }

    // Get merchantId from context
    const suppliermerchantId = getMerchantId(c);
    if (!suppliermerchantId) {
      return c.json({ ok: false, error: 'no_store', message: 'يجب إنشاء متجر أولاً' }, 400);
    }

    const supabase = getSupabaseClient(c.env);
    const body = await c.req.json();

    // التحقق من البيانات المطلوبة
    const { title, description, media, supplier_price, stock_qty, is_dropship_enabled, is_active } = body;

    if (!title || !supplier_price || supplier_price <= 0) {
      return c.json({ ok: false, error: 'invalid_input', message: 'الرجاء إدخال عنوان وسعر صحيح' }, 400);
    }

    // إنشاء المنتج
    const { data, error } = await supabase
      .from('dropship_products')
      .insert({
        supplier_store_id: suppliermerchantId,
        title,
        description: description || null,
        media: media || [],
        supplier_price: parseFloat(supplier_price),
        stock_qty: parseInt(stock_qty) || 0,
        is_dropship_enabled: is_dropship_enabled === true,
        is_active: is_active !== false,
      })
      .select()
      .single();

    if (error) {
      logError(c, 'createDropshipProduct', error);
      return c.json({ ok: false, error: 'database_error', message: error.message }, 500);
    }

    return c.json({ ok: true, data }, 201);
  } catch (error: any) {
    logError(c, 'createDropshipProduct', error);
    return c.json({ ok: false, error: 'server_error', message: error.message }, 500);
  }
}

/**
 * PATCH /secure/dropship/products/:id
 * تحديث منتج دروب شوبينق
 */
export async function updateDropshipProduct(c: Context<{ Bindings: Env; Variables: SupabaseAuthContext }>) {
  try {
    const userRole = c.get('userRole') as string;
    const productId = c.req.param('id');

    if (userRole !== 'merchant' && userRole !== 'admin') {
      return c.json({ ok: false, error: 'forbidden' }, 403);
    }

    const supabase = getSupabaseClient(c.env);
    const body = await c.req.json();

    // Get merchantId from context
    const merchantId = getMerchantId(c);
    if (!merchantId) {
      return c.json({ ok: false, error: 'forbidden' }, 403);
    }

    // التحقق من أن المنتج يخص التاجر
    const { data: product, error: productError } = await supabase
      .from('dropship_products')
      .select('supplier_store_id')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return c.json({ ok: false, error: 'not_found' }, 404);
    }

    if (merchantId !== product.supplier_store_id) {
      return c.json({ ok: false, error: 'forbidden' }, 403);
    }

    // تحديث المنتج
    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.media !== undefined) updateData.media = body.media;
    if (body.supplier_price !== undefined) updateData.supplier_price = parseFloat(body.supplier_price);
    if (body.stock_qty !== undefined) updateData.stock_qty = parseInt(body.stock_qty);
    if (body.is_dropship_enabled !== undefined) updateData.is_dropship_enabled = body.is_dropship_enabled;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;

    const { data, error } = await supabase
      .from('dropship_products')
      .update(updateData)
      .eq('id', productId)
      .select()
      .single();

    if (error) {
      logError(c, 'updateDropshipProduct', error);
      return c.json({ ok: false, error: 'database_error' }, 500);
    }

    return c.json({ ok: true, data });
  } catch (error: any) {
    logError(c, 'updateDropshipProduct', error);
    return c.json({ ok: false, error: 'server_error' }, 500);
  }
}

/**
 * GET /secure/dropship/products
 * جلب منتجات المورد
 */
export async function getSupplierDropshipProducts(c: Context<{ Bindings: Env; Variables: SupabaseAuthContext }>) {
  try {
    const userRole = c.get('userRole') as string;

    if (userRole !== 'merchant' && userRole !== 'admin') {
      return c.json({ ok: false, error: 'forbidden' }, 403);
    }

    // Get merchantId from context
    const suppliermerchantId = getMerchantId(c);
    if (!suppliermerchantId) {
      return c.json({ ok: false, error: 'no_store' }, 400);
    }

    const supabase = getSupabaseClient(c.env);

    // جلب المنتجات
    const { data, error } = await supabase
      .from('dropship_products')
      .select('*')
      .eq('supplier_store_id', suppliermerchantId)
      .order('created_at', { ascending: false });

    if (error) {
      logError(c, 'getSupplierDropshipProducts', error);
      return c.json({ ok: false, error: 'database_error' }, 500);
    }

    return c.json({ ok: true, data: data || [] });
  } catch (error: any) {
    logError(c, 'getSupplierDropshipProducts', error);
    return c.json({ ok: false, error: 'server_error' }, 500);
  }
}

/**
 * ========================================
 * RESELLER ENDPOINTS
 * ========================================
 */

/**
 * GET /secure/dropship/catalog
 * جلب كتالوج منتجات الدروب شوبينق المتاحة
 */
export async function getDropshipCatalog(c: Context<{ Bindings: Env; Variables: SupabaseAuthContext }>) {
  try {
    const userRole = c.get('userRole') as string;

    if (userRole !== 'merchant' && userRole !== 'admin') {
      return c.json({ ok: false, error: 'forbidden' }, 403);
    }

    // Get merchantId from context
    const resellermerchantId = getMerchantId(c);
    if (!resellermerchantId) {
      return c.json({ ok: false, error: 'no_store' }, 400);
    }

    const supabase = getSupabaseClient(c.env);

    // جلب المنتجات المتاحة مع معلومات التاجر
    const { data, error } = await supabase
      .from('dropship_products')
      .select(`
        *,
        merchants!dropship_products_supplier_store_id_fkey (
          name,
          slug
        )
      `)
      .eq('is_dropship_enabled', true)
      .eq('is_active', true)
      .gt('stock_qty', 0)
      .neq('supplier_store_id', resellermerchantId)
      .order('created_at', { ascending: false });

    if (error) {
      logError(c, 'getDropshipCatalog', error);
      return c.json({ ok: false, error: 'database_error' }, 500);
    }

    // تنسيق البيانات
    const formattedData = (data || []).map((item: any) => ({
      ...item,
      supplier_store_name: item.merchants?.name || null,
      supplier_store_slug: item.merchants?.slug || null,
      merchants: undefined, // إزالة كائن merchants المتداخل
    }));

    return c.json({ ok: true, data: formattedData });
  } catch (error: any) {
    logError(c, 'getDropshipCatalog', error);
    return c.json({ ok: false, error: 'server_error' }, 500);
  }
}

/**
 * POST /secure/dropship/listings
 * إضافة منتج للقائمة (إنشاء Listing)
 */
export async function createResellerListing(c: Context<{ Bindings: Env; Variables: SupabaseAuthContext }>) {
  try {
    const userRole = c.get('userRole') as string;

    if (userRole !== 'merchant' && userRole !== 'admin') {
      return c.json({ ok: false, error: 'forbidden' }, 403);
    }

    const supabase = getSupabaseClient(c.env);
    const body = await c.req.json();
    const { dropship_product_id, resale_price, is_active } = body;

    if (!dropship_product_id || !resale_price || resale_price <= 0) {
      return c.json({ ok: false, error: 'invalid_input', message: 'الرجاء إدخال بيانات صحيحة' }, 400);
    }

    // Get merchantId from context
    const resellermerchantId = getMerchantId(c);
    if (!resellermerchantId) {
      return c.json({ ok: false, error: 'no_store' }, 400);
    }

    // التحقق من المنتج
    const { data: product, error: productError } = await supabase
      .from('dropship_products')
      .select('*')
      .eq('id', dropship_product_id)
      .single();

    if (productError || !product) {
      return c.json({ ok: false, error: 'not_found', message: 'المنتج غير موجود' }, 404);
    }

    // منع self-resell
    if (product.supplier_store_id === resellermerchantId) {
      return c.json({ ok: false, error: 'self_resell', message: 'لا يمكنك بيع منتجك الخاص' }, 400);
    }

    // التحقق من توفر المنتج
    if (!product.is_dropship_enabled || !product.is_active || product.stock_qty <= 0) {
      return c.json({ ok: false, error: 'unavailable', message: 'المنتج غير متاح للدروب شوبينق' }, 400);
    }

    // التحقق من عدم وجود listing مسبق
    const { data: existingListing } = await supabase
      .from('reseller_listings')
      .select('id')
      .eq('reseller_store_id', resellermerchantId)
      .eq('dropship_product_id', dropship_product_id)
      .single();

    if (existingListing) {
      return c.json({ ok: false, error: 'already_exists', message: 'المنتج موجود بالفعل في قائمتك' }, 400);
    }

    // إنشاء Listing
    const { data, error } = await supabase
      .from('reseller_listings')
      .insert({
        reseller_store_id: resellermerchantId,
        dropship_product_id,
        resale_price: parseFloat(resale_price),
        is_active: is_active !== false,
      })
      .select()
      .single();

    if (error) {
      logError(c, 'createResellerListing', error);
      return c.json({ ok: false, error: 'database_error', message: error.message }, 500);
    }

    return c.json({ ok: true, data }, 201);
  } catch (error: any) {
    logError(c, 'createResellerListing', error);
    return c.json({ ok: false, error: 'server_error', message: error.message }, 500);
  }
}

/**
 * GET /secure/dropship/listings
 * جلب قوائم الموزع
 */
export async function getResellerListings(c: Context<{ Bindings: Env; Variables: SupabaseAuthContext }>) {
  try {
    const userRole = c.get('userRole') as string;

    if (userRole !== 'merchant' && userRole !== 'admin') {
      return c.json({ ok: false, error: 'forbidden' }, 403);
    }

    // Get merchantId from context
    const resellermerchantId = getMerchantId(c);
    if (!resellermerchantId) {
      return c.json({ ok: false, error: 'no_store' }, 400);
    }

    const supabase = getSupabaseClient(c.env);

    // جلب Listings مع معلومات المنتج والتاجر
    const { data, error } = await supabase
      .from('reseller_listings')
      .select(`
        *,
        dropship_products!reseller_listings_dropship_product_id_fkey (
          title,
          description,
          media,
          supplier_price,
          stock_qty,
          merchants!dropship_products_supplier_store_id_fkey (
            name
          )
        )
      `)
      .eq('reseller_store_id', resellermerchantId)
      .order('created_at', { ascending: false });

    if (error) {
      logError(c, 'getResellerListings', error);
      return c.json({ ok: false, error: 'database_error' }, 500);
    }

    // تنسيق البيانات
    const formattedData = (data || []).map((item: any) => ({
      ...item,
      title: item.dropship_products?.title,
      description: item.dropship_products?.description,
      media: item.dropship_products?.media,
      supplier_price: item.dropship_products?.supplier_price,
      stock_qty: item.dropship_products?.stock_qty,
      supplier_store_name: item.dropship_products?.merchants?.name || null,
      dropship_products: undefined, // إزالة كائن dropship_products المتداخل
    }));

    return c.json({ ok: true, data: formattedData });
  } catch (error: any) {
    logError(c, 'getResellerListings', error);
    return c.json({ ok: false, error: 'server_error' }, 500);
  }
}

/**
 * PATCH /secure/dropship/listings/:id
 * تحديث Listing
 */
export async function updateResellerListing(c: Context<{ Bindings: Env; Variables: SupabaseAuthContext }>) {
  try {
    const userRole = c.get('userRole') as string;
    const listingId = c.req.param('id');

    if (userRole !== 'merchant' && userRole !== 'admin') {
      return c.json({ ok: false, error: 'forbidden' }, 403);
    }

    // Get merchantId from context
    const merchantId = getMerchantId(c);
    if (!merchantId) {
      return c.json({ ok: false, error: 'forbidden' }, 403);
    }

    const supabase = getSupabaseClient(c.env);
    const body = await c.req.json();

    // التحقق من أن Listing يخص الموزع
    const { data: listing, error: listingError } = await supabase
      .from('reseller_listings')
      .select('reseller_store_id')
      .eq('id', listingId)
      .single();

    if (listingError || !listing) {
      return c.json({ ok: false, error: 'not_found' }, 404);
    }

    if (merchantId !== listing.reseller_store_id) {
      return c.json({ ok: false, error: 'forbidden' }, 403);
    }

    // تحديث Listing
    const updateData: any = {};
    if (body.resale_price !== undefined) updateData.resale_price = parseFloat(body.resale_price);
    if (body.is_active !== undefined) updateData.is_active = body.is_active;

    const { data, error } = await supabase
      .from('reseller_listings')
      .update(updateData)
      .eq('id', listingId)
      .select()
      .single();

    if (error) {
      logError(c, 'updateResellerListing', error);
      return c.json({ ok: false, error: 'database_error' }, 500);
    }

    return c.json({ ok: true, data });
  } catch (error: any) {
    logError(c, 'updateResellerListing', error);
    return c.json({ ok: false, error: 'server_error' }, 500);
  }
}

/**
 * ========================================
 * SUPPLIER ORDERS ENDPOINTS
 * ========================================
 */

/**
 * GET /secure/supplier/orders
 * جلب طلبات التوريد للمورد
 */
export async function getSupplierOrders(c: Context<{ Bindings: Env; Variables: SupabaseAuthContext }>) {
  try {
    const userRole = c.get('userRole') as string;

    if (userRole !== 'merchant' && userRole !== 'admin') {
      return c.json({ ok: false, error: 'forbidden' }, 403);
    }

    // Get merchantId from context
    const suppliermerchantId = getMerchantId(c);
    if (!suppliermerchantId) {
      return c.json({ ok: false, error: 'no_store' }, 400);
    }

    const supabase = getSupabaseClient(c.env);

    // جلب طلبات التوريد مع معلومات الطلب والمنتج
    const { data, error } = await supabase
      .from('supplier_orders')
      .select(`
        *,
        orders!supplier_orders_order_id_fkey (
          id,
          order_number,
          status,
          total_amount,
          customer_name,
          customer_phone,
          shipping_address,
          created_at
        ),
        dropship_products!supplier_orders_dropship_product_id_fkey (
          title,
          media
        ),
        merchants!supplier_orders_reseller_store_id_fkey (
          name,
          slug
        )
      `)
      .eq('supplier_store_id', suppliermerchantId)
      .order('created_at', { ascending: false });

    if (error) {
      logError(c, 'getSupplierOrders', error);
      return c.json({ ok: false, error: 'database_error' }, 500);
    }

    return c.json({ ok: true, data: data || [] });
  } catch (error: any) {
    logError(c, 'getSupplierOrders', error);
    return c.json({ ok: false, error: 'server_error' }, 500);
  }
}

/**
 * PATCH /secure/supplier/orders/:id
 * تحديث حالة طلب التوريد
 */
export async function updateSupplierOrder(c: Context<{ Bindings: Env; Variables: SupabaseAuthContext }>) {
  try {
    const userRole = c.get('userRole') as string;
    const supplierOrderId = c.req.param('id');

    if (userRole !== 'merchant' && userRole !== 'admin') {
      return c.json({ ok: false, error: 'forbidden' }, 403);
    }

    // Get merchantId from context
    const merchantId = getMerchantId(c);
    if (!merchantId) {
      return c.json({ ok: false, error: 'forbidden' }, 403);
    }

    const supabase = getSupabaseClient(c.env);
    const body = await c.req.json();
    const { supplier_status, tracking_number, shipping_provider } = body;

    // التحقق من أن الطلب يخص المورد
    const { data: supplierOrder, error: orderError } = await supabase
      .from('supplier_orders')
      .select('supplier_store_id, order_id')
      .eq('id', supplierOrderId)
      .single();

    if (orderError || !supplierOrder) {
      return c.json({ ok: false, error: 'not_found' }, 404);
    }

    if (merchantId !== supplierOrder.supplier_store_id) {
      return c.json({ ok: false, error: 'forbidden' }, 403);
    }

    // تحديث حالة طلب التوريد
    const updateData: any = {};
    if (supplier_status !== undefined) updateData.supplier_status = supplier_status;
    if (tracking_number !== undefined) updateData.tracking_number = tracking_number;
    if (shipping_provider !== undefined) updateData.shipping_provider = shipping_provider;

    const { data, error } = await supabase
      .from('supplier_orders')
      .update(updateData)
      .eq('id', supplierOrderId)
      .select()
      .single();

    if (error) {
      logError(c, 'updateSupplierOrder', error);
      return c.json({ ok: false, error: 'database_error' }, 500);
    }

    // تحديث حالة الطلب الأصلي عند الموزع (mapping الحالات)
    let orderStatus = 'processing';
    if (supplier_status === 'shipped') orderStatus = 'shipped';
    else if (supplier_status === 'delivered') orderStatus = 'delivered';
    else if (supplier_status === 'cancelled') orderStatus = 'cancelled';

    await supabase
      .from('orders')
      .update({ status: orderStatus })
      .eq('id', supplierOrder.order_id);

    return c.json({ ok: true, data });
  } catch (error: any) {
    logError(c, 'updateSupplierOrder', error);
    return c.json({ ok: false, error: 'server_error' }, 500);
  }
}

/**
 * ========================================
 * PUBLIC CHECKOUT WITH DROPSHIP SUPPORT
 * ========================================
 */

/**
 * POST /public/checkout
 * إنشاء طلب شراء من متجر الموزع (يدعم Dropship)
 * TODO: دمج مع endpoint الدفع الكامل عند توفر Tap
 */
export async function createDropshipOrder(c: Context<{ Bindings: Env }>) {
  try {
    const body = await c.req.json();
    const { storeSlug, items, customer, payment_method } = body;

    if (!storeSlug || !items || !Array.isArray(items) || items.length === 0 || !customer) {
      return c.json({ ok: false, error: 'invalid_input', message: 'بيانات غير صحيحة' }, 400);
    }

    const supabase = getSupabaseClient(c.env);

    // 1. الحصول على reseller_store_id من storeSlug
    const { data: store, error: storeError } = await supabase
      .from('merchants')
      .select('id')
      .eq('slug', storeSlug)
      .eq('is_active', true)
      .single();

    if (storeError || !store) {
      return c.json({ ok: false, error: 'store_not_found' }, 404);
    }

    const resellermerchantId = store.id;

    // 2. معالجة العناصر وإنشاء الطلب
    let orderTotal = 0;
    const orderItems: any[] = [];
    const dropshipItems: any[] = [];

    for (const item of items) {
      const { listing_id, qty } = item;

      // التحقق من Listing
      const { data: listing, error: listingError } = await supabase
        .from('reseller_listings')
        .select(`
          *,
          dropship_products!reseller_listings_dropship_product_id_fkey (
            id,
            supplier_store_id,
            supplier_price,
            stock_qty,
            title
          )
        `)
        .eq('id', listing_id)
        .eq('is_active', true)
        .single();

      if (listingError || !listing) {
        return c.json({ ok: false, error: 'listing_not_found', message: `Listing ${listing_id} not found` }, 404);
      }

      const dropshipProduct = listing.dropship_products as any;

      if (!dropshipProduct) {
        return c.json({ ok: false, error: 'product_not_found' }, 404);
      }

      // التحقق من المخزون
      if (dropshipProduct.stock_qty < qty) {
        return c.json({ ok: false, error: 'insufficient_stock', message: `Insufficient stock for ${dropshipProduct.title}` }, 400);
      }

      const itemTotal = listing.resale_price * qty;
      orderTotal += itemTotal;

      // إضافة للقائمة المناسبة
      if (listing.dropship_product_id) {
        dropshipItems.push({
          listing,
          dropshipProduct,
          qty,
          itemTotal,
        });
      }

      orderItems.push({
        product_id: null, // Dropship products لا ترتبط بـ products table
        quantity: qty,
        unit_price: listing.resale_price,
      });
    }

    // 3. حساب العمولة
    const commissionTotal = orderTotal * 0.05; // 5%
    const supplierFee = orderTotal * 0.025; // 2.5%
    const resellerFee = orderTotal * 0.025; // 2.5%

    // 4. إنشاء الطلب
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_id: null, // Public checkout قد لا يكون لديه customer_id
        store_id: resellermerchantId,
        is_dropship: dropshipItems.length > 0,
        reseller_store_id: resellermerchantId,
        supplier_store_id: dropshipItems.length > 0 ? (dropshipItems[0].dropshipProduct as any).supplier_store_id : null,
        reseller_listing_id: dropshipItems.length > 0 ? dropshipItems[0].listing.id : null,
        customer_name: customer.name,
        customer_phone: customer.phone,
        shipping_address: customer.address || {},
        status: 'pending',
        payment_status: 'pending',
        payment_method: payment_method || 'cash_on_delivery',
        subtotal: orderTotal,
        total_amount: orderTotal,
        commission_total: commissionTotal,
        commission_supplier: supplierFee,
        commission_reseller: resellerFee,
      })
      .select()
      .single();

    if (orderError) {
      logError(c, 'createDropshipOrder', orderError);
      return c.json({ ok: false, error: 'database_error', message: orderError.message }, 500);
    }

    // 5. إنشاء order_items
    for (const item of orderItems) {
      await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          product_id: null, // Dropship
          quantity: item.quantity,
          unit_price: item.unit_price,
        });
    }

    // 6. إنشاء supplier_orders وتحديث المخزون
    for (const item of dropshipItems) {
      // إنشاء supplier_order
      await supabase
        .from('supplier_orders')
        .insert({
          order_id: order.id,
          supplier_store_id: (item.dropshipProduct as any).supplier_store_id,
          reseller_store_id: resellermerchantId,
          dropship_product_id: (item.dropshipProduct as any).id,
          quantity: item.qty,
          supplier_status: 'new',
        });

      // إنقاص المخزون
      await supabase
        .from('dropship_products')
        .update({ stock_qty: (item.dropshipProduct as any).stock_qty - item.qty })
        .eq('id', (item.dropshipProduct as any).id);
    }

    // TODO: دمج مع Tap payment gateway عند توفرها
    // if (payment_method === 'tap') { ... }

    return c.json({
      ok: true,
      data: {
        order_id: order.id,
        order_number: order.order_number,
        total_amount: order.total_amount,
        status: order.status,
        payment_status: order.payment_status,
      },
    }, 201);
  } catch (error: any) {
    logError(c, 'createDropshipOrder', error);
    return c.json({ ok: false, error: 'server_error', message: error.message }, 500);
  }
}


