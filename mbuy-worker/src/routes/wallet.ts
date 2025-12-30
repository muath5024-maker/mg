/**
 * Wallet Routes Module
 * Wallet and points management routes
 */

import { Hono } from 'hono';
import { Env, SupabaseAuthContext } from '../types';
import { getSupabaseClient } from '../utils/supabase';

type Variables = SupabaseAuthContext;

const walletRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// ========================================
// Wallet Operations
// ========================================

// Get wallet balance
walletRoutes.get('/', async (c) => {
  try {
    const userId = c.get('authUserId') as string;

    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/wallets?owner_id=eq.${userId}&type=eq.customer&select=*`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${c.env.SUPABASE_ANON_KEY}`,
        },
      }
    );

    const data = await response.json() as any[];
    return c.json({ ok: true, data: data[0] || null });
  } catch (error: any) {
    return c.json({ error: 'Failed to get wallet', detail: error.message }, 500);
  }
});

// Add funds to wallet
walletRoutes.post('/add', async (c) => {
  try {
    const userId = c.get('authUserId') as string;
    const body = await c.req.json();

    const response = await fetch(`${c.env.SUPABASE_URL}/functions/v1/wallet_add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-key': c.env.EDGE_INTERNAL_KEY,
      },
      body: JSON.stringify({ ...body, user_id: userId }),
    });

    const data = await response.json();
    return c.json(data, response.status as any);
  } catch (error: any) {
    return c.json({ error: 'Failed to add wallet funds', detail: error.message }, 500);
  }
});

// Get wallet transactions
walletRoutes.post('/transactions', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const body = await c.req.json();

    const response = await fetch(`${c.env.SUPABASE_URL}/functions/v1/wallet_transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader!,
        'x-internal-key': c.env.EDGE_INTERNAL_KEY,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return c.json(data, response.status as any);
  } catch (error: any) {
    return c.json({ error: 'Failed to get wallet transactions', detail: error.message }, 500);
  }
});

// Get wallet transactions (GET version)
walletRoutes.get('/transactions', async (c) => {
  try {
    const userId = c.get('authUserId') as string;
    const limit = c.req.query('limit') || '20';
    const offset = c.req.query('offset') || '0';

    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/wallet_transactions?wallet_id=eq.${userId}&select=*&order=created_at.desc&limit=${limit}&offset=${offset}`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${c.env.SUPABASE_ANON_KEY}`,
        },
      }
    );

    const data = await response.json();
    return c.json({ ok: true, data });
  } catch (error: any) {
    return c.json({ error: 'Failed to get wallet transactions', detail: error.message }, 500);
  }
});

// ========================================
// Points Operations
// ========================================

// Get points balance
walletRoutes.get('/points', async (c) => {
  try {
    const userId = c.get('authUserId') as string;

    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/points_accounts?user_id=eq.${userId}&select=*`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${c.env.SUPABASE_ANON_KEY}`,
        },
      }
    );

    const data = await response.json() as any[];
    return c.json({ ok: true, data: data[0] || null });
  } catch (error: any) {
    return c.json({ error: 'Failed to get points', detail: error.message }, 500);
  }
});

// Add points
walletRoutes.post('/points/add', async (c) => {
  try {
    const userId = c.get('authUserId') as string;
    const body = await c.req.json();

    const response = await fetch(`${c.env.SUPABASE_URL}/functions/v1/points_add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-key': c.env.EDGE_INTERNAL_KEY,
      },
      body: JSON.stringify({ ...body, user_id: userId }),
    });

    const data = await response.json();
    return c.json(data, response.status as any);
  } catch (error: any) {
    return c.json({ error: 'Failed to add points', detail: error.message }, 500);
  }
});

// Get points transactions
walletRoutes.post('/points/transactions', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const body = await c.req.json();

    const response = await fetch(`${c.env.SUPABASE_URL}/functions/v1/points_transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader!,
        'x-internal-key': c.env.EDGE_INTERNAL_KEY,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return c.json(data, response.status as any);
  } catch (error: any) {
    return c.json({ error: 'Failed to get points transactions', detail: error.message }, 500);
  }
});

export default walletRoutes;
