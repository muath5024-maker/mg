/**
 * Points System Endpoints
 * Manages merchant points balance and transactions
 */

import { Context } from 'hono';
import { Env, SupabaseAuthContext } from '../types';

type PointsContext = Context<{ Bindings: Env; Variables: SupabaseAuthContext }>;

/**
 * Get merchant's points balance
 * GET /secure/points
 */
export async function getPointsBalance(c: PointsContext) {
  try {
    const profileId = c.get('profileId');
    
    // Get merchant's store
    const merchantResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/merchants?id=eq.${profileId}&select=id,points_balance`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const merchants: any[] = await merchantResponse.json();
    
    if (!merchants || merchants.length === 0) {
      return c.json({
        ok: true,
        data: {
          balance: 0,
          currency: 'points',
        },
      });
    }
    
    const merchant = merchants[0];
    
    return c.json({
      ok: true,
      data: {
        balance: merchant.points_balance || 0,
        currency: 'points',
        merchant_id: merchant.id,
      },
    });
    
  } catch (error: any) {
    console.error('Get points balance error:', error);
    return c.json({
      ok: false,
      error: 'Internal server error',
      message: 'حدث خطأ في جلب رصيد النقاط',
    }, 500);
  }
}

/**
 * Get points transaction history
 * GET /secure/points/transactions
 */
export async function getPointsTransactions(c: PointsContext) {
  try {
    const profileId = c.get('profileId');
    const url = new URL(c.req.url);
    const limit = url.searchParams.get('limit') || '20';
    const offset = url.searchParams.get('offset') || '0';
    
    // Get merchant's store
    const merchantResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/merchants?id=eq.${profileId}&select=id`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const merchants: any[] = await merchantResponse.json();
    
    if (!merchants || merchants.length === 0) {
      return c.json({
        ok: true,
        data: [],
        total: 0,
      });
    }
    
    const merchantId = merchants[0].id;
    
    // Get transactions (from promotions spent)
    const transactionsResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/promotions?store_id=eq.${merchantId}&select=id,budget_points,promo_type,status,created_at&order=created_at.desc&limit=${limit}&offset=${offset}`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'count=exact',
        },
      }
    );
    
    const transactions: any[] = await transactionsResponse.json();
    const totalCount = parseInt(transactionsResponse.headers.get('content-range')?.split('/')[1] || '0');
    
    // Transform to transaction format
    const formattedTransactions = transactions.map(t => ({
      id: t.id,
      type: 'spend',
      amount: t.budget_points || 0,
      description: t.promo_type === 'pin' ? 'تثبيت حملة' : 'تعزيز حملة',
      status: t.status,
      created_at: t.created_at,
    }));
    
    return c.json({
      ok: true,
      data: formattedTransactions,
      total: totalCount,
    });
    
  } catch (error: any) {
    console.error('Get points transactions error:', error);
    return c.json({
      ok: false,
      error: 'Internal server error',
    }, 500);
  }
}

/**
 * Add points to merchant balance (admin only or purchase)
 * POST /secure/points/add
 */
export async function addPoints(c: PointsContext) {
  try {
    const profileId = c.get('profileId');
    const body = await c.req.json();
    
    const { amount, reason } = body;
    
    if (!amount || amount <= 0) {
      return c.json({
        ok: false,
        error: 'Invalid amount',
        message: 'المبلغ يجب أن يكون أكبر من صفر',
      }, 400);
    }
    
    // Get merchant's store
    const merchantResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/merchants?id=eq.${profileId}&select=id,points_balance`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const merchants: any[] = await merchantResponse.json();
    
    if (!merchants || merchants.length === 0) {
      return c.json({
        ok: false,
        error: 'Store not found',
        message: 'لم يتم العثور على متجرك',
      }, 404);
    }
    
    const merchant = merchants[0];
    const newBalance = (merchant.points_balance || 0) + amount;
    
    // Update balance
    const updateResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/merchants?id=eq.${merchant.id}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          points_balance: newBalance,
          updated_at: new Date().toISOString(),
        }),
      }
    );
    
    if (!updateResponse.ok) {
      throw new Error('Failed to update balance');
    }
    
    return c.json({
      ok: true,
      data: {
        previous_balance: merchant.points_balance || 0,
        added: amount,
        new_balance: newBalance,
        reason: reason || 'manual_add',
      },
      message: 'تم إضافة النقاط بنجاح',
    });
    
  } catch (error: any) {
    console.error('Add points error:', error);
    return c.json({
      ok: false,
      error: 'Internal server error',
    }, 500);
  }
}


