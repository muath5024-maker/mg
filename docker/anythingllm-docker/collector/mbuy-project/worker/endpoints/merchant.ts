/**
 * Merchant Endpoints - إدارة المتاجر
 * NEW: Uses merchants table instead of stores
 * Updated: Uses SupabaseClient with typed responses
 * 
 * Tables:
 * - merchants (main merchant/store data)
 * - merchant_users (merchant employees)
 * - merchant_settings (merchant configuration)
 */

import { Context } from 'hono';
import { Env, AuthContext, UserType } from '../types';
import { SupabaseClient } from '../types/supabase.client';
import { Merchant, MerchantUser } from '../types/database.types';

// Table names
const TABLES = {
  merchants: 'merchants',
  merchant_users: 'merchant_users',
  merchant_settings: 'merchant_settings',
  merchant_followers: 'merchant_followers',
  merchant_reviews: 'merchant_reviews',
} as const;

/**
 * Create Supabase client helper
 */
function createSupabase(env: Env): SupabaseClient {
  return new SupabaseClient(env);
}

/**
 * GET /secure/merchant/store
 * Get current merchant's store info
 */
export async function getMerchantStore(c: Context<{ Bindings: Env; Variables: AuthContext }>) {
  try {
    const userId = c.get('userId' as any) as string;
    const userType = c.get('userType' as any) as UserType;
    const merchantId = c.get('merchantId' as any) as string;

    if (!userId) {
      return c.json({
        ok: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required',
      }, 401);
    }

    // Check if user is merchant or merchant_user
    if (!['merchant', 'merchant_user', 'admin', 'owner'].includes(userType)) {
      return c.json({
        ok: false,
        error: 'FORBIDDEN',
        message: 'Only merchants can access store information',
      }, 403);
    }

    // Get merchant ID
    const targetMerchantId = merchantId || (userType === 'merchant' ? userId : null);
    
    if (!targetMerchantId) {
      return c.json({
        ok: true,
        data: null,
        message: 'No store found',
      });
    }

    // Fetch merchant using SupabaseClient
    const supabase = createSupabase(c.env);
    const { data: merchant, error } = await supabase.selectSingle<Merchant>(
      TABLES.merchants,
      { id: `eq.${targetMerchantId}` }
    );

    if (error) {
      return c.json({
        ok: false,
        error: 'DATABASE_ERROR',
        message: 'Failed to fetch store',
      }, 500);
    }

    // Remove sensitive fields
    if (merchant) {
      const { password_hash, ...safeMerchant } = merchant;
      return c.json({
        ok: true,
        data: safeMerchant,
      });
    }

    return c.json({
      ok: true,
      data: null,
    });

  } catch (error: any) {
    console.error('[getMerchantStore] Error:', error);
    return c.json({
      ok: false,
      error: 'INTERNAL_ERROR',
      message: error.message || 'Internal server error',
    }, 500);
  }
}

/**
 * PUT /secure/merchant/store
 * Update merchant store info
 */
export async function updateMerchantStore(c: Context<{ Bindings: Env; Variables: AuthContext }>) {
  try {
    const userId = c.get('userId' as any) as string;
    const userType = c.get('userType' as any) as UserType;
    const merchantId = c.get('merchantId' as any) as string;

    if (!userId) {
      return c.json({
        ok: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required',
      }, 401);
    }

    // Only merchant owner can update store
    if (userType !== 'merchant' && userType !== 'admin' && userType !== 'owner') {
      return c.json({
        ok: false,
        error: 'FORBIDDEN',
        message: 'Only merchant owner can update store',
      }, 403);
    }

    const targetMerchantId = userType === 'merchant' ? userId : merchantId;
    
    if (!targetMerchantId) {
      return c.json({
        ok: false,
        error: 'NOT_FOUND',
        message: 'No store to update',
      }, 404);
    }

    // Get request body
    const body = await c.req.json();
    const { name, phone, logo_url } = body;

    // Build update data with proper typing
    const updateData: Partial<Merchant> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (logo_url !== undefined) updateData.logo_url = logo_url;

    // Update merchant using SupabaseClient
    const supabase = createSupabase(c.env);
    const { data: merchant, error } = await supabase.updateSingle<Merchant>(
      TABLES.merchants,
      targetMerchantId,
      updateData
    );

    if (error) {
      console.error('[updateMerchantStore] Update failed:', error.message);
      return c.json({
        ok: false,
        error: 'DATABASE_ERROR',
        message: 'Failed to update store',
      }, 500);
    }

    // Remove sensitive fields
    if (merchant) {
      const { password_hash, ...safeMerchant } = merchant;
      return c.json({
        ok: true,
        data: safeMerchant,
      });
    }

    return c.json({
      ok: true,
      data: null,
    });

  } catch (error: any) {
    console.error('[updateMerchantStore] Error:', error);
    return c.json({
      ok: false,
      error: 'INTERNAL_ERROR',
      message: error.message || 'Internal server error',
    }, 500);
  }
}

/**
 * GET /secure/merchant/settings
 * Get merchant settings
 */
export async function getMerchantSettings(c: Context<{ Bindings: Env; Variables: AuthContext }>) {
  try {
    const userId = c.get('userId' as any) as string;
    const userType = c.get('userType' as any) as UserType;
    const merchantId = c.get('merchantId' as any) as string;

    if (!userId) {
      return c.json({
        ok: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required',
      }, 401);
    }

    const targetMerchantId = merchantId || (userType === 'merchant' ? userId : null);
    
    if (!targetMerchantId) {
      return c.json({
        ok: true,
        data: null,
      });
    }

    // Fetch merchant settings using SupabaseClient
    const supabase = createSupabase(c.env);
    const { data: settings, error } = await supabase.selectSingle<Record<string, any>>(
      TABLES.merchant_settings,
      { merchant_id: `eq.${targetMerchantId}` }
    );

    if (error) {
      return c.json({
        ok: false,
        error: 'DATABASE_ERROR',
        message: 'Failed to fetch settings',
      }, 500);
    }

    return c.json({
      ok: true,
      data: settings || null,
    });

  } catch (error: any) {
    console.error('[getMerchantSettings] Error:', error);
    return c.json({
      ok: false,
      error: 'INTERNAL_ERROR',
      message: error.message || 'Internal server error',
    }, 500);
  }
}

/**
 * GET /secure/merchant/users
 * Get merchant employees
 */
export async function getMerchantUsers(c: Context<{ Bindings: Env; Variables: AuthContext }>) {
  try {
    const userId = c.get('userId' as any) as string;
    const userType = c.get('userType' as any) as UserType;
    const merchantId = c.get('merchantId' as any) as string;

    if (!userId) {
      return c.json({
        ok: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required',
      }, 401);
    }

    // Only merchant owner can see employees
    if (userType !== 'merchant' && userType !== 'admin' && userType !== 'owner') {
      return c.json({
        ok: false,
        error: 'FORBIDDEN',
        message: 'Only merchant owner can view employees',
      }, 403);
    }

    const targetMerchantId = userType === 'merchant' ? userId : merchantId;
    
    if (!targetMerchantId) {
      return c.json({
        ok: true,
        data: [],
      });
    }

    // Fetch merchant users using SupabaseClient
    const supabase = createSupabase(c.env);
    const { data: users, error } = await supabase.select<MerchantUser>(
      TABLES.merchant_users,
      { merchant_id: `eq.${targetMerchantId}` },
      { select: 'id,email,name,phone,role,permissions,is_active,created_at' }
    );

    if (error) {
      return c.json({
        ok: false,
        error: 'DATABASE_ERROR',
        message: 'Failed to fetch employees',
      }, 500);
    }

    return c.json({
      ok: true,
      data: users || [],
    });

  } catch (error: any) {
    console.error('[getMerchantUsers] Error:', error);
    return c.json({
      ok: false,
      error: 'INTERNAL_ERROR',
      message: error.message || 'Internal server error',
    }, 500);
  }
}

/**
 * POST /secure/merchant/users
 * Add merchant employee
 */
export async function addMerchantUser(c: Context<{ Bindings: Env; Variables: AuthContext }>) {
  try {
    const userId = c.get('userId' as any) as string;
    const userType = c.get('userType' as any) as UserType;

    if (!userId) {
      return c.json({
        ok: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required',
      }, 401);
    }

    // Only merchant owner can add employees
    if (userType !== 'merchant') {
      return c.json({
        ok: false,
        error: 'FORBIDDEN',
        message: 'Only merchant owner can add employees',
      }, 403);
    }

    const body = await c.req.json();
    const { email, name, phone, role, permissions } = body;

    if (!email) {
      return c.json({
        ok: false,
        error: 'VALIDATION_ERROR',
        message: 'Email is required',
      }, 400);
    }

    // Import hash function
    const { hashPassword } = await import('../middleware/authMiddleware');

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const passwordHash = await hashPassword(tempPassword);

    // Create merchant user data with proper typing
    const newUserData: Partial<MerchantUser> = {
      merchant_id: userId, // merchant owner's ID
      email: email.toLowerCase().trim(),
      password_hash: passwordHash,
      name: name || null,
      phone: phone || null,
      role: role || 'staff',
      permissions: permissions || [],
      is_active: true,
      invited_at: new Date().toISOString(),
    };

    // Create merchant user using SupabaseClient
    const supabase = createSupabase(c.env);
    const { data: newUser, error } = await supabase.insertSingle<MerchantUser>(
      TABLES.merchant_users,
      newUserData
    );

    if (error) {
      console.error('[addMerchantUser] Insert failed:', error.message);
      
      if (error.message.includes('duplicate') || error.message.includes('unique')) {
        return c.json({
          ok: false,
          error: 'EMAIL_EXISTS',
          message: 'Email already registered',
        }, 409);
      }

      return c.json({
        ok: false,
        error: 'DATABASE_ERROR',
        message: 'Failed to add employee',
      }, 500);
    }

    // Remove sensitive fields
    if (newUser) {
      const { password_hash, ...safeUser } = newUser;
      
      // TODO: Send invitation email with temp password

      return c.json({
        ok: true,
        data: safeUser,
        temp_password: tempPassword, // In production, send via email instead
        message: 'Employee added. Please share the temporary password securely.',
      }, 201);
    }

    return c.json({
      ok: false,
      error: 'CREATE_FAILED',
      message: 'Failed to create employee',
    }, 500);

  } catch (error: any) {
    console.error('[addMerchantUser] Error:', error);
    return c.json({
      ok: false,
      error: 'INTERNAL_ERROR',
      message: error.message || 'Internal server error',
    }, 500);
  }
}

// ============================================
// MERCHANT FOLLOWERS (متابعة المتجر)
// ============================================

/**
 * POST /public/merchants/:merchantId/follow
 * Follow a merchant (for customers)
 */
export async function followMerchant(c: Context<{ Bindings: Env; Variables: AuthContext }>) {
  try {
    const customerId = c.get('userId' as any) as string;
    const userType = c.get('userType' as any) as UserType;
    const merchantId = c.req.param('merchantId');

    if (!customerId) {
      return c.json({
        ok: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required',
      }, 401);
    }

    if (userType !== 'customer') {
      return c.json({
        ok: false,
        error: 'FORBIDDEN',
        message: 'Only customers can follow merchants',
      }, 403);
    }

    if (!merchantId) {
      return c.json({
        ok: false,
        error: 'VALIDATION_ERROR',
        message: 'Merchant ID is required',
      }, 400);
    }

    const supabase = createSupabase(c.env);

    // Check if already following
    const { data: existing } = await supabase.selectSingle<any>(
      TABLES.merchant_followers,
      {
        merchant_id: `eq.${merchantId}`,
        customer_id: `eq.${customerId}`
      }
    );

    if (existing) {
      return c.json({
        ok: false,
        error: 'ALREADY_FOLLOWING',
        message: 'Already following this merchant',
      }, 409);
    }

    // Create follow
    const { data: follow, error } = await supabase.insertSingle<any>(
      TABLES.merchant_followers,
      {
        merchant_id: merchantId,
        customer_id: customerId,
        followed_at: new Date().toISOString(),
      }
    );

    if (error) {
      return c.json({
        ok: false,
        error: 'DATABASE_ERROR',
        message: 'Failed to follow merchant',
      }, 500);
    }

    return c.json({
      ok: true,
      data: follow,
      message: 'Successfully followed merchant',
    }, 201);

  } catch (error: any) {
    console.error('[followMerchant] Error:', error);
    return c.json({
      ok: false,
      error: 'INTERNAL_ERROR',
      message: error.message || 'Internal server error',
    }, 500);
  }
}

/**
 * DELETE /public/merchants/:merchantId/follow
 * Unfollow a merchant
 */
export async function unfollowMerchant(c: Context<{ Bindings: Env; Variables: AuthContext }>) {
  try {
    const customerId = c.get('userId' as any) as string;
    const merchantId = c.req.param('merchantId');

    if (!customerId) {
      return c.json({
        ok: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required',
      }, 401);
    }

    if (!merchantId) {
      return c.json({
        ok: false,
        error: 'VALIDATION_ERROR',
        message: 'Merchant ID is required',
      }, 400);
    }

    const supabase = createSupabase(c.env);

    const { error } = await supabase.delete(
      TABLES.merchant_followers,
      {
        merchant_id: `eq.${merchantId}`,
        customer_id: `eq.${customerId}`
      }
    );

    if (error) {
      return c.json({
        ok: false,
        error: 'DATABASE_ERROR',
        message: 'Failed to unfollow merchant',
      }, 500);
    }

    return c.json({
      ok: true,
      message: 'Successfully unfollowed merchant',
    });

  } catch (error: any) {
    console.error('[unfollowMerchant] Error:', error);
    return c.json({
      ok: false,
      error: 'INTERNAL_ERROR',
      message: error.message || 'Internal server error',
    }, 500);
  }
}

/**
 * GET /public/merchants/:merchantId/followers/count
 * Get merchant followers count
 */
export async function getMerchantFollowersCount(c: Context<{ Bindings: Env }>) {
  try {
    const merchantId = c.req.param('merchantId');

    if (!merchantId) {
      return c.json({
        ok: false,
        error: 'VALIDATION_ERROR',
        message: 'Merchant ID is required',
      }, 400);
    }

    const supabase = createSupabase(c.env);

    const { data: followers, error } = await supabase.select<any>(
      TABLES.merchant_followers,
      { merchant_id: `eq.${merchantId}` },
      { select: 'id' }
    );

    if (error) {
      return c.json({
        ok: false,
        error: 'DATABASE_ERROR',
        message: 'Failed to get followers count',
      }, 500);
    }

    return c.json({
      ok: true,
      data: {
        count: followers?.length || 0,
      },
    });

  } catch (error: any) {
    console.error('[getMerchantFollowersCount] Error:', error);
    return c.json({
      ok: false,
      error: 'INTERNAL_ERROR',
      message: error.message || 'Internal server error',
    }, 500);
  }
}

/**
 * GET /public/merchants/:merchantId/is-following
 * Check if current customer is following merchant
 */
export async function isFollowingMerchant(c: Context<{ Bindings: Env; Variables: AuthContext }>) {
  try {
    const customerId = c.get('userId' as any) as string;
    const merchantId = c.req.param('merchantId');

    if (!customerId) {
      return c.json({
        ok: true,
        data: { is_following: false },
      });
    }

    if (!merchantId) {
      return c.json({
        ok: false,
        error: 'VALIDATION_ERROR',
        message: 'Merchant ID is required',
      }, 400);
    }

    const supabase = createSupabase(c.env);

    const { data: existing } = await supabase.selectSingle<any>(
      TABLES.merchant_followers,
      {
        merchant_id: `eq.${merchantId}`,
        customer_id: `eq.${customerId}`
      }
    );

    return c.json({
      ok: true,
      data: {
        is_following: !!existing,
      },
    });

  } catch (error: any) {
    console.error('[isFollowingMerchant] Error:', error);
    return c.json({
      ok: false,
      error: 'INTERNAL_ERROR',
      message: error.message || 'Internal server error',
    }, 500);
  }
}

/**
 * GET /secure/customer/following
 * Get list of merchants the customer is following
 */
export async function getFollowingMerchants(c: Context<{ Bindings: Env; Variables: AuthContext }>) {
  try {
    const customerId = c.get('userId' as any) as string;

    if (!customerId) {
      return c.json({
        ok: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required',
      }, 401);
    }

    const supabase = createSupabase(c.env);

    // Get following with merchant details
    const { data: following, error } = await supabase.select<any>(
      TABLES.merchant_followers,
      { customer_id: `eq.${customerId}` },
      { select: 'id,merchant_id,followed_at' }
    );

    if (error) {
      return c.json({
        ok: false,
        error: 'DATABASE_ERROR',
        message: 'Failed to get following list',
      }, 500);
    }

    // Get merchant details for each
    if (following && following.length > 0) {
      const merchantIds = following.map((f: any) => f.merchant_id);
      const { data: merchants } = await supabase.select<Merchant>(
        TABLES.merchants,
        { id: `in.(${merchantIds.join(',')})` },
        { select: 'id,name,logo_url,phone' }
      );

      // Merge data
      const result = following.map((f: any) => ({
        ...f,
        merchant: merchants?.find((m: any) => m.id === f.merchant_id) || null,
      }));

      return c.json({
        ok: true,
        data: result,
      });
    }

    return c.json({
      ok: true,
      data: [],
    });

  } catch (error: any) {
    console.error('[getFollowingMerchants] Error:', error);
    return c.json({
      ok: false,
      error: 'INTERNAL_ERROR',
      message: error.message || 'Internal server error',
    }, 500);
  }
}

// ============================================
// MERCHANT REVIEWS (تقييم المتجر)
// ============================================

/**
 * POST /public/merchants/:merchantId/reviews
 * Add a review for a merchant
 */
export async function addMerchantReview(c: Context<{ Bindings: Env; Variables: AuthContext }>) {
  try {
    const customerId = c.get('userId' as any) as string;
    const userType = c.get('userType' as any) as UserType;
    const merchantId = c.req.param('merchantId');

    if (!customerId) {
      return c.json({
        ok: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required',
      }, 401);
    }

    if (userType !== 'customer') {
      return c.json({
        ok: false,
        error: 'FORBIDDEN',
        message: 'Only customers can add reviews',
      }, 403);
    }

    if (!merchantId) {
      return c.json({
        ok: false,
        error: 'VALIDATION_ERROR',
        message: 'Merchant ID is required',
      }, 400);
    }

    const body = await c.req.json();
    const { rating, title, review } = body;

    if (!rating || rating < 1 || rating > 5) {
      return c.json({
        ok: false,
        error: 'VALIDATION_ERROR',
        message: 'Rating must be between 1 and 5',
      }, 400);
    }

    const supabase = createSupabase(c.env);

    // Check if customer already reviewed this merchant
    const { data: existing } = await supabase.selectSingle<any>(
      TABLES.merchant_reviews,
      {
        merchant_id: `eq.${merchantId}`,
        customer_id: `eq.${customerId}`
      }
    );

    if (existing) {
      return c.json({
        ok: false,
        error: 'ALREADY_REVIEWED',
        message: 'You have already reviewed this merchant',
      }, 409);
    }

    // Create review
    const { data: newReview, error } = await supabase.insertSingle<any>(
      TABLES.merchant_reviews,
      {
        merchant_id: merchantId,
        customer_id: customerId,
        rating: Math.round(rating),
        title: title || null,
        review: review || null,
        created_at: new Date().toISOString(),
      }
    );

    if (error) {
      return c.json({
        ok: false,
        error: 'DATABASE_ERROR',
        message: 'Failed to add review',
      }, 500);
    }

    return c.json({
      ok: true,
      data: newReview,
      message: 'Review added successfully',
    }, 201);

  } catch (error: any) {
    console.error('[addMerchantReview] Error:', error);
    return c.json({
      ok: false,
      error: 'INTERNAL_ERROR',
      message: error.message || 'Internal server error',
    }, 500);
  }
}

/**
 * GET /public/merchants/:merchantId/reviews
 * Get merchant reviews
 */
export async function getMerchantReviews(c: Context<{ Bindings: Env }>) {
  try {
    const merchantId = c.req.param('merchantId');
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = parseInt(c.req.query('offset') || '0');

    if (!merchantId) {
      return c.json({
        ok: false,
        error: 'VALIDATION_ERROR',
        message: 'Merchant ID is required',
      }, 400);
    }

    const supabase = createSupabase(c.env);

    const { data: reviews, error } = await supabase.select<any>(
      TABLES.merchant_reviews,
      { merchant_id: `eq.${merchantId}` },
      {
        select: 'id,rating,title,review,created_at,customer_id',
        order: 'created_at.desc',
        limit,
        offset
      }
    );

    if (error) {
      return c.json({
        ok: false,
        error: 'DATABASE_ERROR',
        message: 'Failed to get reviews',
      }, 500);
    }

    return c.json({
      ok: true,
      data: reviews || [],
    });

  } catch (error: any) {
    console.error('[getMerchantReviews] Error:', error);
    return c.json({
      ok: false,
      error: 'INTERNAL_ERROR',
      message: error.message || 'Internal server error',
    }, 500);
  }
}

/**
 * GET /public/merchants/:merchantId/rating
 * Get merchant average rating and stats
 */
export async function getMerchantRating(c: Context<{ Bindings: Env }>) {
  try {
    const merchantId = c.req.param('merchantId');

    if (!merchantId) {
      return c.json({
        ok: false,
        error: 'VALIDATION_ERROR',
        message: 'Merchant ID is required',
      }, 400);
    }

    const supabase = createSupabase(c.env);

    const { data: reviews, error } = await supabase.select<any>(
      TABLES.merchant_reviews,
      { merchant_id: `eq.${merchantId}` },
      { select: 'rating' }
    );

    if (error) {
      return c.json({
        ok: false,
        error: 'DATABASE_ERROR',
        message: 'Failed to get rating',
      }, 500);
    }

    if (!reviews || reviews.length === 0) {
      return c.json({
        ok: true,
        data: {
          average_rating: 0,
          total_reviews: 0,
          rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        },
      });
    }

    // Calculate stats
    const total = reviews.length;
    const sum = reviews.reduce((acc: number, r: any) => acc + r.rating, 0);
    const average = sum / total;

    // Rating distribution
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r: any) => {
      if (r.rating >= 1 && r.rating <= 5) {
        distribution[r.rating as keyof typeof distribution]++;
      }
    });

    return c.json({
      ok: true,
      data: {
        average_rating: Math.round(average * 10) / 10,
        total_reviews: total,
        rating_distribution: distribution,
      },
    });

  } catch (error: any) {
    console.error('[getMerchantRating] Error:', error);
    return c.json({
      ok: false,
      error: 'INTERNAL_ERROR',
      message: error.message || 'Internal server error',
    }, 500);
  }
}

/**
 * DELETE /public/merchants/:merchantId/reviews/:reviewId
 * Delete own review
 */
export async function deleteMerchantReview(c: Context<{ Bindings: Env; Variables: AuthContext }>) {
  try {
    const customerId = c.get('userId' as any) as string;
    const merchantId = c.req.param('merchantId');
    const reviewId = c.req.param('reviewId');

    if (!customerId) {
      return c.json({
        ok: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required',
      }, 401);
    }

    if (!merchantId || !reviewId) {
      return c.json({
        ok: false,
        error: 'VALIDATION_ERROR',
        message: 'Merchant ID and Review ID are required',
      }, 400);
    }

    const supabase = createSupabase(c.env);

    // Only allow deleting own review
    const { error } = await supabase.delete(
      TABLES.merchant_reviews,
      {
        id: `eq.${reviewId}`,
        customer_id: `eq.${customerId}`
      }
    );

    if (error) {
      return c.json({
        ok: false,
        error: 'DATABASE_ERROR',
        message: 'Failed to delete review',
      }, 500);
    }

    return c.json({
      ok: true,
      message: 'Review deleted successfully',
    });

  } catch (error: any) {
    console.error('[deleteMerchantReview] Error:', error);
    return c.json({
      ok: false,
      error: 'INTERNAL_ERROR',
      message: error.message || 'Internal server error',
    }, 500);
  }
}

