/**
 * Store Web APIs for Multi-Tenant Store Platform
 * These endpoints are used by Next.js storefront
 */

import { Context } from 'hono';
import { Env, SupabaseAuthContext } from '../types';

/**
 * Get store by slug (public)
 * GET /public/store/{slug}
 */
export async function getStoreBySlug(c: Context<{ Bindings: Env }>) {
  try {
    const slug = c.req.param('slug') as string;

    if (!slug) {
      return c.json(
        {
          ok: false,
          error: 'Store slug is required',
        },
        400
      );
    }

    // Fetch store by slug
    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/merchants?slug=eq.${encodeURIComponent(
        slug
      )}&select=id,name,description,slug,public_url,logo_url,cover_image_url,city,rating,followers_count,is_verified,is_active,created_at`,
      {
        headers: {
          apikey: c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      return c.json(
        {
          ok: false,
          error: 'Failed to fetch store',
        },
        response.status as any
      );
    }

    const data: any[] = await response.json();

    if (!data || data.length === 0) {
      return c.json(
        {
          ok: false,
          error: 'Store not found',
          message: 'المتجر غير موجود أو غير متاح',
        },
        404
      );
    }

    const store = data[0];

    // Check if store is active
    if (!store.is_active) {
      return c.json(
        {
          ok: false,
          error: 'Store unavailable',
          message: 'المتجر غير متاح حالياً',
        },
        404
      );
    }

    return c.json({
      ok: true,
      data: store,
    });
  } catch (error: any) {
    return c.json(
      {
        ok: false,
        error: 'Internal server error',
        detail: error.message,
      },
      500
    );
  }
}

/**
 * Get store theme configuration
 * GET /public/store/{slug}/theme
 */
export async function getStoreTheme(c: Context<{ Bindings: Env }>) {
  try {
    const slug = c.req.param('slug') as string;

    if (!slug) {
      return c.json(
        {
          ok: false,
          error: 'Store slug is required',
        },
        400
      );
    }

    // First get store ID
    const merchantResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/merchants?slug=eq.${encodeURIComponent(
        slug
      )}&select=id,is_active`,
      {
        headers: {
          apikey: c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    const storeData: any[] = await merchantResponse.json();

    if (!storeData || storeData.length === 0 || !storeData[0].is_active) {
      return c.json(
        {
          ok: false,
          error: 'Store not found',
        },
        404
      );
    }

    const merchantId = storeData[0].id;

    // Fetch store theme settings
    // Assuming we have a store_settings table or store_theme table
    // For now, return default theme
    const themeResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/store_settings?store_id=eq.${merchantId}&select=theme_id,primary_color,secondary_color`,
      {
        headers: {
          apikey: c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    let themeData: any = {
      theme_id: 'modern',
      primary_color: '#2563EB',
      secondary_color: '#7C3AED',
    };

    if (themeResponse.ok) {
      const settings: any[] = await themeResponse.json();
      if (settings && settings.length > 0) {
        themeData = {
          theme_id: settings[0].theme_id || 'modern',
          primary_color: settings[0].primary_color || '#2563EB',
          secondary_color: settings[0].secondary_color || '#7C3AED',
        };
      }
    }

    return c.json({
      ok: true,
      data: themeData,
    });
  } catch (error: any) {
    return c.json(
      {
        ok: false,
        error: 'Internal server error',
        detail: error.message,
      },
      500
    );
  }
}

/**
 * Get store branding (logo, colors, etc.)
 * GET /public/store/{slug}/branding
 */
export async function getStoreBranding(c: Context<{ Bindings: Env }>) {
  try {
    const slug = c.req.param('slug') as string;

    if (!slug) {
      return c.json(
        {
          ok: false,
          error: 'Store slug is required',
        },
        400
      );
    }

    // Fetch store branding
    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/merchants?slug=eq.${encodeURIComponent(
        slug
      )}&select=id,name,logo_url,cover_image_url,is_active`,
      {
        headers: {
          apikey: c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    const data: any[] = await response.json();

    if (!data || data.length === 0 || !data[0].is_active) {
      return c.json(
        {
          ok: false,
          error: 'Store not found',
        },
        404
      );
    }

    const store = data[0];

    // Get theme colors
    const themeResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/store_settings?store_id=eq.${store.id}&select=primary_color,secondary_color,theme_id`,
      {
        headers: {
          apikey: c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    let colors = {
      primary: '#2563EB',
      secondary: '#7C3AED',
    };

    if (themeResponse.ok) {
      const settings: any[] = await themeResponse.json();
      if (settings && settings.length > 0) {
        colors = {
          primary: settings[0].primary_color || '#2563EB',
          secondary: settings[0].secondary_color || '#7C3AED',
        };
      }
    }

    return c.json({
      ok: true,
      data: {
        logo_url: store.logo_url,
        cover_image_url: store.cover_image_url,
        colors,
      },
    });
  } catch (error: any) {
    return c.json(
      {
        ok: false,
        error: 'Internal server error',
        detail: error.message,
      },
      500
    );
  }
}

/**
 * Check slug availability
 * GET /secure/store/check-slug?slug={slug}
 */
export async function checkSlugAvailability(
  c: Context<{ Bindings: Env; Variables: SupabaseAuthContext }>
) {
  try {
    const slug = c.req.query('slug') as string;

    if (!slug) {
      return c.json(
        {
          ok: false,
          error: 'Slug is required',
        },
        400
      );
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
    if (!slugRegex.test(slug.toLowerCase())) {
      return c.json(
        {
          ok: false,
          error: 'Invalid slug format',
          message: 'الرابط يجب أن يحتوي على أحرف إنجليزية صغيرة وأرقام وشرطات فقط',
        },
        400
      );
    }

    // Check if slug exists
    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/merchants?slug=eq.${encodeURIComponent(
        slug.toLowerCase()
      )}&select=id`,
      {
        headers: {
          apikey: c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    const existing: any[] = await response.json();

    return c.json({
      ok: true,
      data: {
        available: !existing || existing.length === 0,
        slug: slug.toLowerCase(),
      },
    });
  } catch (error: any) {
    return c.json(
      {
        ok: false,
        error: 'Internal server error',
        detail: error.message,
      },
      500
    );
  }
}

/**
 * Create store (onboarding)
 * POST /secure/store/create
 */
export async function createStore(
  c: Context<{ Bindings: Env; Variables: SupabaseAuthContext }>
) {
  try {
    const profileId = c.get('profileId') as string;
    const body = await c.req.json();
    const { name, slug, description, city } = body;

    if (!name || !slug) {
      return c.json(
        {
          ok: false,
          error: 'Store name and slug are required',
        },
        400
      );
    }

    // Validate slug
    const slugRegex = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
    if (!slugRegex.test(slug.toLowerCase())) {
      return c.json(
        {
          ok: false,
          error: 'Invalid slug format',
        },
        400
      );
    }

    // Check if slug is available
    const checkResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/merchants?slug=eq.${encodeURIComponent(
        slug.toLowerCase()
      )}&select=id`,
      {
        headers: {
          apikey: c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    const existing: any[] = await checkResponse.json();
    if (existing && existing.length > 0) {
      return c.json(
        {
          ok: false,
          error: 'Slug already taken',
          message: 'هذا الرابط مستخدم بالفعل',
        },
        409
      );
    }

    // Create store
    const createResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/stores`,
      {
        method: 'POST',
        headers: {
          apikey: c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          name,
          slug: slug.toLowerCase(),
          description,
          city,
          owner_id: profileId,
          is_active: true,
          public_url: `https://${slug.toLowerCase()}.mbuy.pro`,
        }),
      }
    );

    if (!createResponse.ok) {
      const error = await createResponse.text();
      return c.json(
        {
          ok: false,
          error: 'Failed to create store',
          detail: error,
        },
        createResponse.status as any
      );
    }

    const store: any[] = await createResponse.json();

    // Create default store settings
    await fetch(`${c.env.SUPABASE_URL}/rest/v1/store_settings`, {
      method: 'POST',
      headers: {
        apikey: c.env.SUPABASE_SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        store_id: store[0].id,
        theme_id: 'modern',
        primary_color: '#2563EB',
        secondary_color: '#7C3AED',
      }),
    });

    return c.json({
      ok: true,
      data: store[0],
      message: 'تم إنشاء المتجر بنجاح',
    });
  } catch (error: any) {
    return c.json(
      {
        ok: false,
        error: 'Internal server error',
        detail: error.message,
      },
      500
    );
  }
}

/**
 * Update store branding
 * PUT /secure/store/{id}/branding
 */
export async function updateStoreBranding(
  c: Context<{ Bindings: Env; Variables: SupabaseAuthContext }>
) {
  try {
    const profileId = c.get('profileId') as string;
    const merchantId = c.req.param('id') as string;
    const body = await c.req.json();

    // Verify store ownership
    const merchantResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/merchants?id=eq.${merchantId}&owner_id=eq.${profileId}&select=id`,
      {
        headers: {
          apikey: c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    const store: any[] = await merchantResponse.json();
    if (!store || store.length === 0) {
      return c.json(
        {
          ok: false,
          error: 'Store not found or not authorized',
        },
        404
      );
    }

    // Update store branding
    const updates: any = {};
    if (body.logo_url !== undefined) updates.logo_url = body.logo_url;
    if (body.cover_image_url !== undefined)
      updates.cover_image_url = body.cover_image_url;

    if (Object.keys(updates).length > 0) {
      await fetch(
        `${c.env.SUPABASE_URL}/rest/v1/merchants?id=eq.${merchantId}`,
        {
          method: 'PATCH',
          headers: {
            apikey: c.env.SUPABASE_SERVICE_ROLE_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        }
      );
    }

    // Update theme settings
    const themeUpdates: any = {};
    if (body.primary_color !== undefined)
      themeUpdates.primary_color = body.primary_color;
    if (body.secondary_color !== undefined)
      themeUpdates.secondary_color = body.secondary_color;
    if (body.theme_id !== undefined) themeUpdates.theme_id = body.theme_id;

    if (Object.keys(themeUpdates).length > 0) {
      await fetch(
        `${c.env.SUPABASE_URL}/rest/v1/store_settings?store_id=eq.${merchantId}`,
        {
          method: 'PATCH',
          headers: {
            apikey: c.env.SUPABASE_SERVICE_ROLE_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(themeUpdates),
        }
      );
    }

    return c.json({
      ok: true,
      message: 'تم تحديث هوية المتجر بنجاح',
    });
  } catch (error: any) {
    return c.json(
      {
        ok: false,
        error: 'Internal server error',
        detail: error.message,
      },
      500
    );
  }
}

/**
 * Get AI suggestions for store
 * POST /secure/store/{id}/ai-suggestions
 */
export async function getAISuggestions(
  c: Context<{ Bindings: Env; Variables: SupabaseAuthContext }>
) {
  try {
    const profileId = c.get('profileId') as string;
    const merchantId = c.req.param('id') as string;
    const body = await c.req.json();

    // Verify store ownership
    const merchantResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/merchants?id=eq.${merchantId}&owner_id=eq.${profileId}&select=id,name`,
      {
        headers: {
          apikey: c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    const store: any[] = await merchantResponse.json();
    if (!store || store.length === 0) {
      return c.json(
        {
          ok: false,
          error: 'Store not found or not authorized',
        },
        404
      );
    }

    // Generate AI suggestions using Workers AI
    const prompt = `Generate store branding suggestions for "${body.store_name}". 
    Description: ${body.description || 'No description'}
    Answers: ${JSON.stringify(body.answers || {})}
    
    Provide:
    1. 3 logo design ideas (return image URLs or descriptions)
    2. 3 color gradient suggestions (hex colors)
    3. 3 theme recommendations (modern, classic, minimal)`;

    let suggestions: any = {
      logos: [],
      gradients: [],
      themes: [],
    };

    try {
      // Use Workers AI to generate suggestions
      const aiResponse = await c.env.AI.run(
        '@cf/meta/llama-3.1-8b-instruct',
        {
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }
      );

      // Parse AI response (simplified - in production, parse JSON response)
      // For now, return default suggestions
      suggestions = {
        logos: [
          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
            body.store_name
          )}&backgroundColor=2563eb`,
          `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(
            body.store_name
          )}&backgroundColor=7c3aed`,
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
            body.store_name
          )}`,
        ],
        gradients: [
          { name: 'أزرق كلاسيكي', colors: ['#2563EB', '#1D4ED8'] },
          { name: 'بنفسجي عصري', colors: ['#7C3AED', '#9333EA'] },
          { name: 'أخضر طبيعي', colors: ['#059669', '#047857'] },
        ],
        themes: [
          { id: 'modern', name: 'عصري', preview: 'modern' },
          { id: 'classic', name: 'كلاسيكي', preview: 'classic' },
          { id: 'minimal', name: 'بسيط', preview: 'minimal' },
        ],
      };
    } catch (aiError) {
      console.error('AI generation error:', aiError);
      // Return default suggestions on error
    }

    return c.json({
      ok: true,
      data: suggestions,
    });
  } catch (error: any) {
    return c.json(
      {
        ok: false,
        error: 'Internal server error',
        detail: error.message,
      },
      500
    );
  }
}


