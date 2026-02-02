import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';
import type { Env, AuthContext } from '../types';

const loyaltyProgram = new Hono<{ Bindings: Env; Variables: AuthContext }>();

// Get program settings
loyaltyProgram.get('/program', async (c) => {
  const merchantId = c.get('merchantId') as string;
  const userId = c.get('userId') as string;
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data, error } = await supabase
    .from('loyalty_programs')
    .select('*')
    .eq('store_id', merchantId)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    return c.json({ ok: false, error: error.message }, 500);
  }
  
  return c.json({ ok: true, data: data || null });
});

// Update program settings
loyaltyProgram.put('/program', async (c) => {
  const merchantId = c.get('merchantId') as string;
  const userId = c.get('userId') as string;
  const body = await c.req.json();
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data, error } = await supabase
    .from('loyalty_programs')
    .upsert({
      store_id: merchantId,
      name: body.name,
      description: body.description,
      program_type: body.program_type,
      points_per_currency: body.points_per_currency,
      points_value: body.points_value,
      min_points_redeem: body.min_points_redeem,
      max_points_redeem_percent: body.max_points_redeem_percent,
      points_expiry_days: body.points_expiry_days,
      birthday_multiplier: body.birthday_multiplier,
      first_order_bonus: body.first_order_bonus,
      review_bonus: body.review_bonus,
      referral_bonus: body.referral_bonus,
      is_active: body.is_active,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) return c.json({ ok: false, error: error.message }, 500);
  return c.json({ ok: true, data });
});

// Get tiers
loyaltyProgram.get('/tiers', async (c) => {
  const merchantId = c.get('merchantId') as string;
  const userId = c.get('userId') as string;
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
  
  // Get program first
  const { data: program } = await supabase
    .from('loyalty_programs')
    .select('id')
    .eq('store_id', merchantId)
    .single();
  
  if (!program) return c.json({ ok: true, data: [] });
  
  const { data, error } = await supabase
    .from('loyalty_tiers')
    .select('*')
    .eq('program_id', program.id)
    .order('sort_order');
  
  if (error) return c.json({ ok: false, error: error.message }, 500);
  return c.json({ ok: true, data });
});

// Create tier
loyaltyProgram.post('/tiers', async (c) => {
  const merchantId = c.get('merchantId') as string;
  const userId = c.get('userId') as string;
  const body = await c.req.json();
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
  
  // Get program
  const { data: program } = await supabase
    .from('loyalty_programs')
    .select('id')
    .eq('store_id', merchantId)
    .single();
  
  if (!program) return c.json({ ok: false, error: 'Program not found' }, 404);
  
  const { data, error } = await supabase
    .from('loyalty_tiers')
    .insert({
      program_id: program.id,
      name: body.name,
      description: body.description,
      min_points: body.min_points || 0,
      min_orders: body.min_orders || 0,
      min_spent: body.min_spent || 0,
      points_multiplier: body.points_multiplier || 1.0,
      discount_percent: body.discount_percent,
      free_shipping: body.free_shipping,
      color: body.color,
      icon: body.icon,
      sort_order: body.sort_order || 0
    })
    .select()
    .single();
  
  if (error) return c.json({ ok: false, error: error.message }, 500);
  return c.json({ ok: true, data });
});

// Update tier
loyaltyProgram.put('/tiers/:id', async (c) => {
  const { id } = c.req.param();
  const merchantId = c.get('merchantId') as string;
  const userId = c.get('userId') as string;
  const body = await c.req.json();
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
  
  // Verify ownership
  const { data: program } = await supabase
    .from('loyalty_programs')
    .select('id')
    .eq('store_id', merchantId)
    .single();
  
  const { data, error } = await supabase
    .from('loyalty_tiers')
    .update({
      name: body.name,
      description: body.description,
      min_points: body.min_points,
      min_orders: body.min_orders,
      min_spent: body.min_spent,
      points_multiplier: body.points_multiplier,
      discount_percent: body.discount_percent,
      free_shipping: body.free_shipping,
      color: body.color,
      icon: body.icon,
      is_active: body.is_active
    })
    .eq('id', id)
    .eq('program_id', program?.id)
    .select()
    .single();
  
  if (error) return c.json({ ok: false, error: error.message }, 500);
  return c.json({ ok: true, data });
});

// Delete tier
loyaltyProgram.delete('/tiers/:id', async (c) => {
  const { id } = c.req.param();
  const merchantId = c.get('merchantId') as string;
  const userId = c.get('userId') as string;
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data: program } = await supabase
    .from('loyalty_programs')
    .select('id')
    .eq('store_id', merchantId)
    .single();
  
  const { error } = await supabase
    .from('loyalty_tiers')
    .delete()
    .eq('id', id)
    .eq('program_id', program?.id);
  
  if (error) return c.json({ ok: false, error: error.message }, 500);
  return c.json({ ok: true });
});

// Get members
loyaltyProgram.get('/members', async (c) => {
  const merchantId = c.get('merchantId') as string;
  const userId = c.get('userId') as string;
  const limit = parseInt(c.req.query('limit') || '50');
  const tierId = c.req.query('tier_id');
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
  
  let query = supabase
    .from('loyalty_members')
    .select(`
      *,
      customer:customers(id, full_name, phone, email, avatar_url),
      tier:loyalty_tiers(id, name, color, icon)
    `)
    .eq('store_id', merchantId)
    .order('lifetime_points', { ascending: false })
    .limit(limit);
  
  if (tierId) {
    query = query.eq('tier_id', tierId);
  }
  
  const { data, error } = await query;
  
  if (error) return c.json({ ok: false, error: error.message }, 500);
  return c.json({ ok: true, data });
});

// Get member details
loyaltyProgram.get('/members/:id', async (c) => {
  const { id } = c.req.param();
  const merchantId = c.get('merchantId') as string;
  const userId = c.get('userId') as string;
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const [memberRes, transactionsRes] = await Promise.all([
    supabase
      .from('loyalty_members')
      .select(`
        *,
        customer:customers(id, full_name, phone, email, avatar_url),
        tier:loyalty_tiers(*)
      `)
      .eq('id', id)
      .eq('store_id', merchantId)
      .single(),
    supabase
      .from('loyalty_points_transactions')
      .select('*')
      .eq('member_id', id)
      .order('created_at', { ascending: false })
      .limit(20)
  ]);
  
  if (memberRes.error) return c.json({ ok: false, error: memberRes.error.message }, 500);
  
  return c.json({ 
    ok: true, 
    data: {
      ...memberRes.data,
      transactions: transactionsRes.data || []
    }
  });
});

// Adjust points manually
loyaltyProgram.post('/members/:id/adjust', async (c) => {
  const { id } = c.req.param();
  const merchantId = c.get('merchantId') as string;
  const userId = c.get('userId') as string;
  const body = await c.req.json();
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
  
  // Get member
  const { data: member } = await supabase
    .from('loyalty_members')
    .select('*')
    .eq('id', id)
    .eq('store_id', merchantId)
    .single();
  
  if (!member) return c.json({ ok: false, error: 'Member not found' }, 404);
  
  const points = body.points;
  const newBalance = member.current_points + points;
  
  // Add transaction
  await supabase
    .from('loyalty_points_transactions')
    .insert({
      member_id: id,
      store_id: merchantId,
      transaction_type: 'adjust',
      points: points,
      description: body.reason || 'تعديل يدوي',
      balance_after: newBalance,
      created_by: userId
    });
  
  // Update member
  await supabase
    .from('loyalty_members')
    .update({
      current_points: newBalance,
      lifetime_points: points > 0 ? member.lifetime_points + points : member.lifetime_points,
      last_activity_at: new Date().toISOString()
    })
    .eq('id', id);
  
  return c.json({ ok: true, new_balance: newBalance });
});

// Get rewards
loyaltyProgram.get('/rewards', async (c) => {
  const merchantId = c.get('merchantId') as string;
  const userId = c.get('userId') as string;
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data: program } = await supabase
    .from('loyalty_programs')
    .select('id')
    .eq('store_id', merchantId)
    .single();
  
  if (!program) return c.json({ ok: true, data: [] });
  
  const { data, error } = await supabase
    .from('loyalty_rewards')
    .select('*')
    .eq('program_id', program.id)
    .order('points_cost');
  
  if (error) return c.json({ ok: false, error: error.message }, 500);
  return c.json({ ok: true, data });
});

// Create reward
loyaltyProgram.post('/rewards', async (c) => {
  const merchantId = c.get('merchantId') as string;
  const userId = c.get('userId') as string;
  const body = await c.req.json();
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data: program } = await supabase
    .from('loyalty_programs')
    .select('id')
    .eq('store_id', merchantId)
    .single();
  
  if (!program) return c.json({ ok: false, error: 'Program not found' }, 404);
  
  const { data, error } = await supabase
    .from('loyalty_rewards')
    .insert({
      program_id: program.id,
      name: body.name,
      description: body.description,
      reward_type: body.reward_type,
      points_cost: body.points_cost,
      reward_value: body.reward_value || {},
      min_tier_id: body.min_tier_id,
      limited_quantity: body.limited_quantity,
      valid_from: body.valid_from,
      valid_until: body.valid_until,
      image_url: body.image_url
    })
    .select()
    .single();
  
  if (error) return c.json({ ok: false, error: error.message }, 500);
  return c.json({ ok: true, data });
});

// Update reward
loyaltyProgram.put('/rewards/:id', async (c) => {
  const { id } = c.req.param();
  const merchantId = c.get('merchantId') as string;
  const userId = c.get('userId') as string;
  const body = await c.req.json();
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data: program } = await supabase
    .from('loyalty_programs')
    .select('id')
    .eq('store_id', merchantId)
    .single();
  
  const { data, error } = await supabase
    .from('loyalty_rewards')
    .update({
      name: body.name,
      description: body.description,
      points_cost: body.points_cost,
      reward_value: body.reward_value,
      is_active: body.is_active,
      valid_until: body.valid_until
    })
    .eq('id', id)
    .eq('program_id', program?.id)
    .select()
    .single();
  
  if (error) return c.json({ ok: false, error: error.message }, 500);
  return c.json({ ok: true, data });
});

// Delete reward
loyaltyProgram.delete('/rewards/:id', async (c) => {
  const { id } = c.req.param();
  const merchantId = c.get('merchantId') as string;
  const userId = c.get('userId') as string;
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data: program } = await supabase
    .from('loyalty_programs')
    .select('id')
    .eq('store_id', merchantId)
    .single();
  
  const { error } = await supabase
    .from('loyalty_rewards')
    .delete()
    .eq('id', id)
    .eq('program_id', program?.id);
  
  if (error) return c.json({ ok: false, error: error.message }, 500);
  return c.json({ ok: true });
});

// Get redemptions
loyaltyProgram.get('/redemptions', async (c) => {
  const merchantId = c.get('merchantId') as string;
  const userId = c.get('userId') as string;
  const status = c.req.query('status');
  const limit = parseInt(c.req.query('limit') || '50');
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
  
  let query = supabase
    .from('loyalty_redemptions')
    .select(`
      *,
      member:loyalty_members(
        id,
        customer:customers(id, full_name, phone)
      ),
      reward:loyalty_rewards(id, name, reward_type)
    `)
    .eq('store_id', merchantId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (status) {
    query = query.eq('status', status);
  }
  
  const { data, error } = await query;
  
  if (error) return c.json({ ok: false, error: error.message }, 500);
  return c.json({ ok: true, data });
});

// Get statistics
loyaltyProgram.get('/stats', async (c) => {
  const merchantId = c.get('merchantId') as string;
  const userId = c.get('userId') as string;
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const [programRes, membersRes, tiersRes] = await Promise.all([
    supabase
      .from('loyalty_programs')
      .select('total_members, total_points_issued, total_points_redeemed')
      .eq('store_id', merchantId)
      .single(),
    supabase
      .from('loyalty_members')
      .select('tier_id, current_points')
      .eq('store_id', merchantId),
    supabase
      .from('loyalty_tiers')
      .select('id, name')
      .eq('program_id', (await supabase.from('loyalty_programs').select('id').eq('store_id', merchantId).single()).data?.id)
  ]);
  
  const program = programRes.data;
  const members = membersRes.data || [];
  const tiers = tiersRes.data || [];
  
  // Count members per tier
  const tierCounts: Record<string, number> = {};
  tiers.forEach(t => { tierCounts[t.id] = 0; });
  members.forEach(m => {
    if (m.tier_id && tierCounts[m.tier_id] !== undefined) {
      tierCounts[m.tier_id]++;
    }
  });
  
  return c.json({
    ok: true,
    data: {
      total_members: program?.total_members || 0,
      total_points_issued: program?.total_points_issued || 0,
      total_points_redeemed: program?.total_points_redeemed || 0,
      points_outstanding: (program?.total_points_issued || 0) - (program?.total_points_redeemed || 0),
      tier_distribution: tiers.map(t => ({
        id: t.id,
        name: t.name,
        count: tierCounts[t.id] || 0
      }))
    }
  });
});

export default loyaltyProgram;
