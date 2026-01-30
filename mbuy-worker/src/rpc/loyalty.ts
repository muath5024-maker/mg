/**
 * Loyalty Program RPC Functions
 * 
 * Points earning, redemption, and tier management
 */

import { sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

/**
 * Award points to a customer
 */
export async function awardPoints(
  db: PostgresJsDatabase,
  params: {
    customerId: string;
    storeId: string;
    points: number;
    reason: string;
    referenceId?: string;
    referenceType?: 'order' | 'referral' | 'review' | 'birthday' | 'bonus' | 'adjustment';
    expiresInDays?: number;
  }
): Promise<{
  transaction_id: string;
  new_balance: number;
  tier_upgraded: boolean;
  new_tier?: string;
}> {
  const { customerId, storeId, points, reason, referenceId, referenceType, expiresInDays } = params;

  return await db.transaction(async (tx) => {
    // Get or create loyalty account
    let [account] = await tx.execute<{
      id: string;
      points_balance: number;
      lifetime_points: number;
      tier_id: string;
    }>(sql`
      SELECT id, points_balance, lifetime_points, tier_id
      FROM loyalty_accounts
      WHERE customer_id = ${customerId} AND store_id = ${storeId}
      FOR UPDATE
    `);

    if (!account) {
      // Create new loyalty account
      const [newAccount] = await tx.execute<{
        id: string;
        points_balance: number;
        lifetime_points: number;
        tier_id: string;
      }>(sql`
        INSERT INTO loyalty_accounts (
          customer_id, store_id, points_balance, lifetime_points, tier_id
        ) VALUES (
          ${customerId}, ${storeId}, 0, 0,
          (SELECT id FROM loyalty_tiers WHERE store_id = ${storeId} AND is_default = true LIMIT 1)
        )
        RETURNING id, points_balance, lifetime_points, tier_id
      `);
      account = newAccount;
    }

    // Calculate expiration date
    const expiresAt = expiresInDays 
      ? sql`NOW() + INTERVAL '${expiresInDays} days'`
      : sql`NULL`;

    // Create points transaction
    const [transaction] = await tx.execute<{ id: string }>(sql`
      INSERT INTO points_transactions (
        account_id, points, balance_before, balance_after,
        transaction_type, reason, reference_id, reference_type,
        expires_at, created_at
      ) VALUES (
        ${account.id}, ${points}, ${account.points_balance}, ${account.points_balance + points},
        'earn', ${reason}, ${referenceId || null}, ${referenceType || null},
        ${expiresAt}, NOW()
      )
      RETURNING id
    `);

    // Update account balance
    const newBalance = account.points_balance + points;
    const newLifetime = account.lifetime_points + points;

    await tx.execute(sql`
      UPDATE loyalty_accounts
      SET 
        points_balance = ${newBalance},
        lifetime_points = ${newLifetime},
        updated_at = NOW()
      WHERE id = ${account.id}
    `);

    // Check for tier upgrade
    const [nextTier] = await tx.execute<{
      id: string;
      name: string;
      min_points: number;
    }>(sql`
      SELECT id, name, min_points
      FROM loyalty_tiers
      WHERE store_id = ${storeId}
        AND min_points <= ${newLifetime}
        AND id != ${account.tier_id}
      ORDER BY min_points DESC
      LIMIT 1
    `);

    let tierUpgraded = false;
    let newTierName: string | undefined;

    if (nextTier) {
      // Check if this is actually an upgrade
      const [currentTier] = await tx.execute<{ min_points: number }>(sql`
        SELECT min_points FROM loyalty_tiers WHERE id = ${account.tier_id}
      `);

      if (!currentTier || nextTier.min_points > currentTier.min_points) {
        await tx.execute(sql`
          UPDATE loyalty_accounts
          SET tier_id = ${nextTier.id}, tier_upgraded_at = NOW()
          WHERE id = ${account.id}
        `);
        tierUpgraded = true;
        newTierName = nextTier.name;

        // Log tier change
        await tx.execute(sql`
          INSERT INTO tier_history (
            account_id, from_tier_id, to_tier_id, changed_at, reason
          ) VALUES (
            ${account.id}, ${account.tier_id}, ${nextTier.id}, NOW(), 'Points milestone'
          )
        `);
      }
    }

    return {
      transaction_id: transaction.id,
      new_balance: newBalance,
      tier_upgraded: tierUpgraded,
      new_tier: newTierName
    };
  });
}

/**
 * Redeem points for a reward or discount
 */
export async function redeemPoints(
  db: PostgresJsDatabase,
  params: {
    customerId: string;
    storeId: string;
    points: number;
    rewardId?: string;
    orderId?: string;
    description: string;
  }
): Promise<{
  success: boolean;
  transaction_id?: string;
  new_balance?: number;
  reward_code?: string;
  error?: string;
}> {
  const { customerId, storeId, points, rewardId, orderId, description } = params;

  return await db.transaction(async (tx) => {
    // Get account with lock
    const [account] = await tx.execute<{
      id: string;
      points_balance: number;
    }>(sql`
      SELECT id, points_balance
      FROM loyalty_accounts
      WHERE customer_id = ${customerId} AND store_id = ${storeId}
      FOR UPDATE
    `);

    if (!account) {
      return { success: false, error: 'Loyalty account not found' };
    }

    if (account.points_balance < points) {
      return { 
        success: false, 
        error: `Insufficient points. Balance: ${account.points_balance}, Required: ${points}` 
      };
    }

    // If redeeming for a reward, check availability
    let rewardCode: string | undefined;
    if (rewardId) {
      const [reward] = await tx.execute<{
        points_cost: number;
        stock: number | null;
        reward_type: string;
      }>(sql`
        SELECT points_cost, stock, reward_type
        FROM loyalty_rewards
        WHERE id = ${rewardId} AND store_id = ${storeId} AND is_active = true
        FOR UPDATE
      `);

      if (!reward) {
        return { success: false, error: 'Reward not found or inactive' };
      }

      if (points < reward.points_cost) {
        return { success: false, error: `This reward costs ${reward.points_cost} points` };
      }

      if (reward.stock !== null && reward.stock <= 0) {
        return { success: false, error: 'Reward is out of stock' };
      }

      // Decrease reward stock
      if (reward.stock !== null) {
        await tx.execute(sql`
          UPDATE loyalty_rewards
          SET stock = stock - 1
          WHERE id = ${rewardId}
        `);
      }

      // Generate reward code
      rewardCode = `RWD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      // Create redeemed reward record
      await tx.execute(sql`
        INSERT INTO redeemed_rewards (
          account_id, reward_id, points_spent, code, status, redeemed_at
        ) VALUES (
          ${account.id}, ${rewardId}, ${points}, ${rewardCode}, 'active', NOW()
        )
      `);
    }

    // Create points transaction (negative for redemption)
    const newBalance = account.points_balance - points;

    const [transaction] = await tx.execute<{ id: string }>(sql`
      INSERT INTO points_transactions (
        account_id, points, balance_before, balance_after,
        transaction_type, reason, reference_id, reference_type, created_at
      ) VALUES (
        ${account.id}, ${-points}, ${account.points_balance}, ${newBalance},
        'redeem', ${description}, ${orderId || rewardId || null}, 
        ${orderId ? 'order' : rewardId ? 'reward' : null}, NOW()
      )
      RETURNING id
    `);

    // Update account balance
    await tx.execute(sql`
      UPDATE loyalty_accounts
      SET points_balance = ${newBalance}, updated_at = NOW()
      WHERE id = ${account.id}
    `);

    return {
      success: true,
      transaction_id: transaction.id,
      new_balance: newBalance,
      reward_code: rewardCode
    };
  });
}

/**
 * Calculate points for an order
 */
export async function calculateOrderPoints(
  db: PostgresJsDatabase,
  params: {
    storeId: string;
    customerId: string;
    orderAmount: number;
    productIds?: string[];
  }
): Promise<{
  base_points: number;
  bonus_points: number;
  multiplier: number;
  total_points: number;
  breakdown: Array<{ source: string; points: number }>;
}> {
  const { storeId, customerId, orderAmount, productIds } = params;

  // Get store loyalty settings
  const [settings] = await db.execute<{
    points_per_currency: number;
    min_order_for_points: number;
  }>(sql`
    SELECT 
      COALESCE(points_per_currency, 1) as points_per_currency,
      COALESCE(min_order_for_points, 0) as min_order_for_points
    FROM loyalty_settings
    WHERE store_id = ${storeId}
  `);

  if (!settings || orderAmount < settings.min_order_for_points) {
    return {
      base_points: 0,
      bonus_points: 0,
      multiplier: 1,
      total_points: 0,
      breakdown: []
    };
  }

  const breakdown: Array<{ source: string; points: number }> = [];
  
  // Base points
  const basePoints = Math.floor(orderAmount * settings.points_per_currency);
  breakdown.push({ source: 'Order base', points: basePoints });

  // Get customer tier multiplier
  const [account] = await db.execute<{
    tier_id: string;
  }>(sql`
    SELECT tier_id FROM loyalty_accounts
    WHERE customer_id = ${customerId} AND store_id = ${storeId}
  `);

  let multiplier = 1;
  if (account?.tier_id) {
    const [tier] = await db.execute<{ points_multiplier: number }>(sql`
      SELECT COALESCE(points_multiplier, 1) as points_multiplier
      FROM loyalty_tiers WHERE id = ${account.tier_id}
    `);
    if (tier) {
      multiplier = tier.points_multiplier;
    }
  }

  // Check for active bonus campaigns
  const bonusCampaigns = await db.execute<{
    bonus_points: number;
    multiplier: number;
    name: string;
  }>(sql`
    SELECT bonus_points, multiplier, name
    FROM points_campaigns
    WHERE store_id = ${storeId}
      AND is_active = true
      AND start_date <= NOW()
      AND (end_date IS NULL OR end_date >= NOW())
  `);

  let bonusPoints = 0;
  let campaignMultiplier = 1;

  for (const campaign of bonusCampaigns as unknown as Array<typeof bonusCampaigns[0]>) {
    if (campaign.bonus_points > 0) {
      bonusPoints += campaign.bonus_points;
      breakdown.push({ source: campaign.name, points: campaign.bonus_points });
    }
    if (campaign.multiplier > 1) {
      campaignMultiplier = Math.max(campaignMultiplier, campaign.multiplier);
    }
  }

  // Check for product-specific bonus points
  if (productIds && productIds.length > 0) {
    const productBonus = await db.execute<{
      product_id: string;
      bonus_points: number;
    }>(sql`
      SELECT product_id, bonus_points
      FROM product_points_bonuses
      WHERE product_id = ANY(${productIds}::uuid[])
        AND is_active = true
        AND (start_date IS NULL OR start_date <= NOW())
        AND (end_date IS NULL OR end_date >= NOW())
    `);

    for (const pb of productBonus as unknown as Array<typeof productBonus[0]>) {
      bonusPoints += pb.bonus_points;
      breakdown.push({ source: `Product bonus`, points: pb.bonus_points });
    }
  }

  const totalMultiplier = multiplier * campaignMultiplier;
  const totalPoints = Math.floor((basePoints * totalMultiplier) + bonusPoints);

  if (totalMultiplier > 1) {
    breakdown.push({ source: `Multiplier (${totalMultiplier}x)`, points: Math.floor(basePoints * (totalMultiplier - 1)) });
  }

  return {
    base_points: basePoints,
    bonus_points: bonusPoints,
    multiplier: totalMultiplier,
    total_points: totalPoints,
    breakdown
  };
}

/**
 * Get customer loyalty summary
 */
export async function getCustomerLoyaltySummary(
  db: PostgresJsDatabase,
  params: {
    customerId: string;
    storeId: string;
  }
): Promise<{
  enrolled: boolean;
  points_balance: number;
  lifetime_points: number;
  tier: {
    id: string;
    name: string;
    benefits: string[];
  } | null;
  next_tier: {
    id: string;
    name: string;
    points_needed: number;
  } | null;
  recent_transactions: Array<{
    id: string;
    points: number;
    type: string;
    reason: string;
    created_at: string;
  }>;
  available_rewards: Array<{
    id: string;
    name: string;
    points_cost: number;
    can_redeem: boolean;
  }>;
}> {
  const { customerId, storeId } = params;

  // Get account
  const [account] = await db.execute<{
    id: string;
    points_balance: number;
    lifetime_points: number;
    tier_id: string;
  }>(sql`
    SELECT id, points_balance, lifetime_points, tier_id
    FROM loyalty_accounts
    WHERE customer_id = ${customerId} AND store_id = ${storeId}
  `);

  if (!account) {
    return {
      enrolled: false,
      points_balance: 0,
      lifetime_points: 0,
      tier: null,
      next_tier: null,
      recent_transactions: [],
      available_rewards: []
    };
  }

  // Get current tier
  const [tier] = await db.execute<{
    id: string;
    name: string;
    benefits: string[];
  }>(sql`
    SELECT id, name, COALESCE(benefits, '{}') as benefits
    FROM loyalty_tiers
    WHERE id = ${account.tier_id}
  `);

  // Get next tier
  const [nextTier] = await db.execute<{
    id: string;
    name: string;
    min_points: number;
  }>(sql`
    SELECT id, name, min_points
    FROM loyalty_tiers
    WHERE store_id = ${storeId} AND min_points > ${account.lifetime_points}
    ORDER BY min_points ASC
    LIMIT 1
  `);

  // Get recent transactions
  const transactions = await db.execute<{
    id: string;
    points: number;
    transaction_type: string;
    reason: string;
    created_at: string;
  }>(sql`
    SELECT id, points, transaction_type, reason, created_at::text
    FROM points_transactions
    WHERE account_id = ${account.id}
    ORDER BY created_at DESC
    LIMIT 10
  `);

  // Get available rewards
  const rewards = await db.execute<{
    id: string;
    name: string;
    points_cost: number;
  }>(sql`
    SELECT id, name, points_cost
    FROM loyalty_rewards
    WHERE store_id = ${storeId}
      AND is_active = true
      AND (stock IS NULL OR stock > 0)
    ORDER BY points_cost ASC
  `);

  return {
    enrolled: true,
    points_balance: account.points_balance,
    lifetime_points: account.lifetime_points,
    tier: tier ? {
      id: tier.id,
      name: tier.name,
      benefits: tier.benefits
    } : null,
    next_tier: nextTier ? {
      id: nextTier.id,
      name: nextTier.name,
      points_needed: nextTier.min_points - account.lifetime_points
    } : null,
    recent_transactions: (transactions as unknown as Array<typeof transactions[0]>).map(t => ({
      id: t.id,
      points: t.points,
      type: t.transaction_type,
      reason: t.reason,
      created_at: t.created_at
    })),
    available_rewards: (rewards as unknown as Array<typeof rewards[0]>).map(r => ({
      id: r.id,
      name: r.name,
      points_cost: r.points_cost,
      can_redeem: account.points_balance >= r.points_cost
    }))
  };
}

/**
 * Expire old points
 */
export async function expirePoints(
  db: PostgresJsDatabase,
  storeId?: string
): Promise<{ expired_transactions: number; total_points_expired: number }> {
  const storeCondition = storeId 
    ? sql`AND la.store_id = ${storeId}`
    : sql``;

  // Find expired points transactions
  const expiredTransactions = await db.execute<{
    id: string;
    account_id: string;
    points: number;
  }>(sql`
    SELECT pt.id, pt.account_id, pt.points
    FROM points_transactions pt
    JOIN loyalty_accounts la ON la.id = pt.account_id
    WHERE pt.transaction_type = 'earn'
      AND pt.expires_at IS NOT NULL
      AND pt.expires_at < NOW()
      AND pt.is_expired = false
      AND pt.points > 0
      ${storeCondition}
    FOR UPDATE
  `);

  let totalExpired = 0;

  for (const tx of expiredTransactions as unknown as Array<typeof expiredTransactions[0]>) {
    // Create expiration transaction
    await db.execute(sql`
      INSERT INTO points_transactions (
        account_id, points, transaction_type, reason, reference_id, created_at
      ) VALUES (
        ${tx.account_id}, ${-tx.points}, 'expire', 'Points expired', ${tx.id}, NOW()
      )
    `);

    // Mark original transaction as expired
    await db.execute(sql`
      UPDATE points_transactions SET is_expired = true WHERE id = ${tx.id}
    `);

    // Update account balance
    await db.execute(sql`
      UPDATE loyalty_accounts
      SET points_balance = GREATEST(points_balance - ${tx.points}, 0)
      WHERE id = ${tx.account_id}
    `);

    totalExpired += tx.points;
  }

  return {
    expired_transactions: (expiredTransactions as unknown as Array<typeof expiredTransactions[0]>).length,
    total_points_expired: totalExpired
  };
}
