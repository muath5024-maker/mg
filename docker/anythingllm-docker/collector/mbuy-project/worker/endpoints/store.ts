/**
 * Store Endpoints - إدارة المتاجر
 * جميع العمليات تعتمد على JWT و AuthContext
 * - merchants table (stores are in merchants table)
 * - merchantId from context
 */

import { Context } from 'hono';
import { Env, SupabaseAuthContext } from '../types';
import { getSupabaseClient } from '../utils/supabase';

/**
 * GET /secure/merchant/store
 * جلب متجر التاجر الحالي
 */
export async function getMerchantStore(c: Context<{ Bindings: Env; Variables: SupabaseAuthContext }>) {
  try {
    // 1. Get auth context from middleware
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
        message: 'Only merchants can access store information',
      }, 403);
    }

    // 3. جلب merchantId من context
    const storeId = c.get('storeId') as string;
    const contextMerchantId = c.get('merchantId') as string;
    const merchantId = contextMerchantId || storeId;

    if (!merchantId) {
      // No store yet - return null
      return c.json({
        ok: true,
        data: null,
      }, 200);
    }

    // 4. جلب المتجر من قاعدة البيانات
    const supabase = getSupabaseClient(c.env);
    const store = await supabase.findById('merchants', merchantId);

    // 5. إرجاع النتيجة
    return c.json({
      ok: true,
      data: store || null,
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
 * POST /secure/merchant/store
 * إنشاء متجر جديد للتاجر
 */
export async function createMerchantStore(c: Context<{ Bindings: Env; Variables: SupabaseAuthContext }>) {
  try {
    // 1. Get auth context from middleware
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
        message: 'Only merchants can create stores',
      }, 403);
    }

    // 3. التحقق من عدم وجود متجر بالفعل
    const storeId = c.get('storeId') as string;
    const contextMerchantId = c.get('merchantId') as string;
    const existingMerchantId = contextMerchantId || storeId;

    if (existingMerchantId) {
      return c.json({
        ok: false,
        code: 'STORE_EXISTS',
        message: 'You already have a store',
      }, 409);
    }

    // 4. قراءة البيانات من الطلب
    const body = await c.req.json();
    const { name, description, city, visibility } = body;

    if (!name || name.trim() === '') {
      return c.json({
        ok: false,
        code: 'VALIDATION_ERROR',
        message: 'Store name is required',
      }, 400);
    }

    // 5. إنشاء المتجر في جدول merchants
    const supabase = getSupabaseClient(c.env);

    const newStore = await supabase.insert('merchants', {
      store_name: name.trim(),
      description: description || '',
      city: city || '',
      visibility: visibility || 'public',
      is_active: true,
      is_verified: false,
    });

    if (!newStore) {
      return c.json({
        ok: false,
        code: 'DATABASE_ERROR',
        message: 'Failed to create store',
      }, 500);
    }

    console.log('[createMerchantStore] Store created:', {
      merchantId: newStore.id,
      profileId: profileId
    });

    // 6. إرجاع المتجر الجديد
    return c.json({
      ok: true,
      store_id: newStore.id,
      data: newStore,
    }, 201);

  } catch (error: any) {
    return c.json({
      ok: false,
      code: 'INTERNAL_ERROR',
      message: error.message || 'Internal server error',
    }, 500);
  }
}

/**
 * PUT /secure/stores/:id
 * تحديث متجر موجود
 */
export async function updateStore(c: Context<{ Bindings: Env; Variables: SupabaseAuthContext }>) {
  try {
    // 1. Get auth context from middleware
    const profileId = c.get('profileId') as string;
    const userRole = c.get('userRole') as string;

    if (!profileId) {
      return c.json({
        ok: false,
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      }, 401);
    }

    // 2. الحصول على store_id من URL
    const paramMerchantId = c.req.param('id');

    if (!paramMerchantId) {
      return c.json({
        ok: false,
        code: 'VALIDATION_ERROR',
        message: 'Store ID is required',
      }, 400);
    }

    // 3. التحقق من ملكية المتجر
    const storeId = c.get('storeId') as string;
    const contextMerchantId = c.get('merchantId') as string;
    const merchantId = contextMerchantId || storeId;

    if (paramMerchantId !== merchantId && userRole !== 'admin') {
      return c.json({
        ok: false,
        code: 'FORBIDDEN',
        message: 'You do not own this store',
      }, 403);
    }

    // 4. قراءة البيانات من الطلب
    const body = await c.req.json();
    const { name, description, city, visibility, is_active, logo_url, banner_url } = body;

    // 5. تحديث المتجر
    const supabase = getSupabaseClient(c.env);

    const updateData: any = {};
    if (name) updateData.store_name = name.trim();
    if (description !== undefined) updateData.description = description;
    if (city !== undefined) updateData.city = city;
    if (visibility) updateData.visibility = visibility;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (logo_url !== undefined) updateData.logo_url = logo_url;
    if (banner_url !== undefined) updateData.banner_url = banner_url;
    updateData.updated_at = new Date().toISOString();

    const updatedStore = await supabase.update('merchants', paramMerchantId, updateData);

    if (!updatedStore) {
      return c.json({
        ok: false,
        code: 'DATABASE_ERROR',
        message: 'Failed to update store',
      }, 500);
    }

    // 6. إرجاع المتجر المحدث
    return c.json({
      ok: true,
      data: updatedStore,
    }, 200);

  } catch (error: any) {
    return c.json({
      ok: false,
      code: 'INTERNAL_ERROR',
      message: error.message || 'Internal server error',
    }, 500);
  }
}


