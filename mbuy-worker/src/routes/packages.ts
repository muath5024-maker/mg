/**
 * Packages Routes - API endpoints لحزم التوفير
 */

import { Hono } from 'hono';
import type {
  PackageType,
  PackageOrder,
  CreatePackageOrderRequest,
  PACKAGE_DEFINITIONS,
  PackageStatus,
} from '../types/packages.types';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  OPENROUTER_API_KEY: string;
  FAL_AI_API_KEY: string;
  ELEVENLABS_API_KEY: string;
  DID_API_KEY: string;
  R2_BUCKET: R2Bucket;
}

interface Variables {
  userId: string;
  storeId: string;
}

const packages = new Hono<{ Bindings: Env; Variables: Variables }>();

// =====================================================
// Helper Functions
// =====================================================

async function supabaseRequest(
  env: Env,
  path: string,
  method: string = 'GET',
  body?: any
) {
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': method === 'POST' ? 'return=representation' : 'return=minimal',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return response;
}

async function checkCredits(env: Env, userId: string, required: number) {
  const response = await supabaseRequest(
    env,
    `user_credits?user_id=eq.${userId}`
  );
  const data = await response.json() as { balance: number }[];
  const balance = data[0]?.balance || 0;
  return { hasEnough: balance >= required, balance };
}

async function deductCredits(env: Env, userId: string, amount: number) {
  return supabaseRequest(env, 'rpc/deduct_credits', 'POST', {
    p_user_id: userId,
    p_amount: amount,
  });
}

// =====================================================
// Package Definitions Endpoint
// =====================================================

// الحصول على تعريفات الحزم المتاحة
packages.get('/definitions', async (c) => {
  const { PACKAGE_DEFINITIONS } = await import('../types/packages.types');
  
  return c.json({
    success: true,
    packages: PACKAGE_DEFINITIONS,
  });
});

// الحصول على تعريف حزمة محددة
packages.get('/definitions/:type', async (c) => {
  const type = c.req.param('type') as PackageType;
  const { PACKAGE_DEFINITIONS } = await import('../types/packages.types');
  
  const packageDef = PACKAGE_DEFINITIONS.find(p => p.id === type);
  
  if (!packageDef) {
    return c.json({ error: 'Package type not found' }, 404);
  }
  
  return c.json({
    success: true,
    package: packageDef,
  });
});

// =====================================================
// Package Orders Endpoints
// =====================================================

// إنشاء طلب حزمة جديد
packages.post('/orders', async (c) => {
  const userId = c.get('userId');
  const storeId = c.get('storeId');
  const body = await c.req.json<CreatePackageOrderRequest>();
  
  const { PACKAGE_DEFINITIONS } = await import('../types/packages.types');
  
  // التحقق من صحة نوع الحزمة
  const packageDef = PACKAGE_DEFINITIONS.find(p => p.id === body.package_type);
  if (!packageDef) {
    return c.json({ error: 'Invalid package type' }, 400);
  }
  
  // التحقق من الرصيد
  const creditCheck = await checkCredits(c.env, userId, packageDef.credits_cost);
  if (!creditCheck.hasEnough) {
    return c.json({
      error: 'Insufficient credits',
      code: 'INSUFFICIENT_CREDITS',
      required: packageDef.credits_cost,
      balance: creditCheck.balance,
    }, 402);
  }
  
  // جلب بيانات المنتج إذا تم تحديده
  let productData = body.product_data;
  if (body.product_id && !productData) {
    const productRes = await supabaseRequest(
      c.env,
      `products?id=eq.${body.product_id}&select=*`
    );
    const products = await productRes.json() as any[];
    if (products.length > 0) {
      const product = products[0];
      productData = {
        name: product.name,
        name_ar: product.name_ar,
        description: product.description,
        description_ar: product.description_ar,
        price: product.price,
        currency: product.currency,
        category: product.category,
        images: product.images || [],
        features: product.features || [],
      };
    }
  }
  
  if (!productData && body.package_type !== 'brand_identity') {
    return c.json({ error: 'Product data is required' }, 400);
  }
  
  // إنشاء الطلب
  const order = {
    user_id: userId,
    store_id: storeId,
    package_type: body.package_type,
    status: 'pending',
    product_id: body.product_id,
    product_data: productData || {},
    brand_data: body.brand_data || {},
    preferences: body.preferences,
    deliverables: [],
    progress: 0,
    current_step: 'queued',
    credits_cost: packageDef.credits_cost,
  };
  
  const response = await supabaseRequest(c.env, 'package_orders', 'POST', order);
  
  if (!response.ok) {
    const error = await response.text();
    return c.json({ error: 'Failed to create order', details: error }, 500);
  }
  
  const createdOrders = await response.json() as PackageOrder[];
  const createdOrder = createdOrders[0];
  
  // خصم الرصيد
  await deductCredits(c.env, userId, packageDef.credits_cost);
  
  // بدء معالجة الحزمة (async)
  // سيتم معالجتها عبر Queue أو Durable Object
  await startPackageProcessing(c.env, createdOrder.id, body.package_type);
  
  return c.json({
    success: true,
    order: createdOrder,
    estimated_time_minutes: packageDef.estimated_time_minutes,
    credits_charged: packageDef.credits_cost,
  }, 201);
});

// الحصول على طلبات المستخدم
packages.get('/orders', async (c) => {
  const userId = c.get('userId');
  const status = c.req.query('status');
  
  let url = `package_orders?user_id=eq.${userId}&order=created_at.desc`;
  if (status) {
    url += `&status=eq.${status}`;
  }
  
  const response = await supabaseRequest(c.env, url);
  const orders = await response.json();
  
  return c.json({
    success: true,
    orders,
  });
});

// الحصول على طلب محدد
packages.get('/orders/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  
  const response = await supabaseRequest(
    c.env,
    `package_orders?id=eq.${id}&user_id=eq.${userId}`
  );
  const orders = await response.json() as PackageOrder[];
  
  if (orders.length === 0) {
    return c.json({ error: 'Order not found' }, 404);
  }
  
  return c.json({
    success: true,
    order: orders[0],
  });
});

// إلغاء طلب (إذا لم تبدأ المعالجة)
packages.delete('/orders/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  
  // جلب الطلب
  const orderRes = await supabaseRequest(
    c.env,
    `package_orders?id=eq.${id}&user_id=eq.${userId}`
  );
  const orders = await orderRes.json() as PackageOrder[];
  
  if (orders.length === 0) {
    return c.json({ error: 'Order not found' }, 404);
  }
  
  const order = orders[0];
  
  // التحقق من إمكانية الإلغاء
  if (order.status !== 'pending' && order.status !== 'draft') {
    return c.json({ 
      error: 'Cannot cancel order that is already processing or completed' 
    }, 400);
  }
  
  // تحديث الحالة
  await supabaseRequest(
    c.env,
    `package_orders?id=eq.${id}`,
    'PATCH',
    { status: 'cancelled' }
  );
  
  // استرداد الرصيد
  await supabaseRequest(c.env, 'rpc/add_credits', 'POST', {
    p_user_id: userId,
    p_amount: order.credits_cost,
  });
  
  return c.json({
    success: true,
    credits_refunded: order.credits_cost,
  });
});

// =====================================================
// Package Processing (Internal)
// =====================================================

async function startPackageProcessing(env: Env, orderId: string, packageType: string) {
  // تحديث حالة الطلب
  await supabaseRequest(
    env,
    `package_orders?id=eq.${orderId}`,
    'PATCH',
    { 
      status: 'processing',
      started_at: new Date().toISOString(),
      current_step: 'initializing',
    }
  );
  
  // في الإنتاج، سيتم إرسال هذا إلى Queue للمعالجة
  // لكن هنا نبدأ المعالجة مباشرة (للتبسيط)
  
  // TODO: إضافة Queue processing
  // await env.PACKAGE_QUEUE.send({ orderId, packageType });
}

// =====================================================
// Package Deliverables Endpoints
// =====================================================

// الحصول على مخرجات الطلب
packages.get('/orders/:id/deliverables', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  
  // التحقق من ملكية الطلب
  const orderRes = await supabaseRequest(
    c.env,
    `package_orders?id=eq.${id}&user_id=eq.${userId}&select=id,status`
  );
  const orders = await orderRes.json() as { id: string; status: string }[];
  
  if (orders.length === 0) {
    return c.json({ error: 'Order not found' }, 404);
  }
  
  // جلب المخرجات
  const deliverableRes = await supabaseRequest(
    c.env,
    `package_deliverables?order_id=eq.${id}&order=created_at.asc`
  );
  const deliverables = await deliverableRes.json();
  
  return c.json({
    success: true,
    status: orders[0].status,
    deliverables,
  });
});

// تطبيق مخرجات على المتجر
packages.post('/orders/:id/apply', async (c) => {
  const userId = c.get('userId');
  const storeId = c.get('storeId');
  const id = c.req.param('id');
  const body = await c.req.json<{ deliverable_ids?: string[]; apply_all?: boolean }>();
  
  // التحقق من ملكية الطلب
  const orderRes = await supabaseRequest(
    c.env,
    `package_orders?id=eq.${id}&user_id=eq.${userId}`
  );
  const orders = await orderRes.json() as PackageOrder[];
  
  if (orders.length === 0) {
    return c.json({ error: 'Order not found' }, 404);
  }
  
  const order = orders[0];
  
  if (order.status !== 'completed') {
    return c.json({ error: 'Order is not completed yet' }, 400);
  }
  
  // جلب المخرجات للتطبيق
  let deliverablesUrl = `package_deliverables?order_id=eq.${id}`;
  if (body.deliverable_ids && body.deliverable_ids.length > 0) {
    deliverablesUrl += `&id=in.(${body.deliverable_ids.join(',')})`;
  }
  
  const deliverableRes = await supabaseRequest(c.env, deliverablesUrl);
  const deliverables = await deliverableRes.json() as any[];
  
  const applied: string[] = [];
  
  for (const deliverable of deliverables) {
    // تطبيق حسب النوع
    switch (deliverable.type) {
      case 'logo':
        // تحديث شعار المتجر
        await supabaseRequest(
          c.env,
          `stores?id=eq.${storeId}`,
          'PATCH',
          { logo_url: deliverable.url }
        );
        applied.push('logo');
        break;
        
      case 'banner':
        // إضافة للـ store_settings
        await supabaseRequest(
          c.env,
          `store_settings?store_id=eq.${storeId}`,
          'PATCH',
          { hero_banner_url: deliverable.url }
        );
        applied.push('banner');
        break;
        
      case 'brand_colors':
        // تحديث ألوان المتجر
        if (deliverable.metadata?.colors) {
          await supabaseRequest(
            c.env,
            `store_settings?store_id=eq.${storeId}`,
            'PATCH',
            { 
              primary_color: deliverable.metadata.colors.primary,
              secondary_color: deliverable.metadata.colors.secondary,
            }
          );
          applied.push('brand_colors');
        }
        break;
    }
    
    // تسجيل التطبيق
    await supabaseRequest(
      c.env,
      `package_deliverables?id=eq.${deliverable.id}`,
      'PATCH',
      { applied_at: new Date().toISOString(), applied_to: storeId }
    );
  }
  
  return c.json({
    success: true,
    applied,
    message: `Applied ${applied.length} items to your store`,
  });
});

export default packages;
