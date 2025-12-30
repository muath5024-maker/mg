/**
 * Merchant Shortcuts System
 * Allows merchants to customize their dashboard shortcuts
 */

import { Context } from 'hono';
import { Env, SupabaseAuthContext } from '../types';
import { createAuditLog } from './auditLogs';

type ShortcutsContext = Context<{ Bindings: Env; Variables: SupabaseAuthContext }>;

/**
 * Get available shortcuts (all possible shortcuts)
 * GET /shortcuts/available
 */
export async function getAvailableShortcuts(c: Context<{ Bindings: Env }>) {
  try {
    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/available_shortcuts?is_enabled=eq.true&select=*&order=sort_order.asc`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      return c.json({
        ok: false,
        error: 'Failed to fetch shortcuts',
      }, response.status as any);
    }
    
    const shortcuts = await response.json();
    
    return c.json({
      ok: true,
      data: shortcuts,
    });
    
  } catch (error: any) {
    return c.json({
      ok: false,
      error: 'Internal server error',
      detail: error.message,
    }, 500);
  }
}

/**
 * Get merchant's shortcuts
 * GET /secure/shortcuts
 */
export async function getMerchantShortcuts(c: ShortcutsContext) {
  try {
    const profileId = c.get('profileId');
    
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
        ok: false,
        error: 'Store not found',
      }, 404);
    }
    
    const merchantId = merchants[0].id;
    
    // Get store settings
    const settingsResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/store_settings?store_id=eq.${merchantId}&select=shortcuts`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const settings: any[] = await settingsResponse.json();
    
    // If no settings, return default shortcuts
    if (!settings || settings.length === 0) {
      const defaultShortcuts = await getDefaultShortcuts(c.env);
      return c.json({
        ok: true,
        data: defaultShortcuts,
        is_default: true,
      });
    }
    
    const merchantShortcuts = settings[0].shortcuts || [];
    
    // Validate shortcuts against available ones
    const availableResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/available_shortcuts?is_enabled=eq.true&select=key`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const available: any[] = await availableResponse.json();
    const availableKeys = new Set(available.map(a => a.key));
    
    // Filter out disabled shortcuts
    const validShortcuts = merchantShortcuts.filter((s: any) => availableKeys.has(s.key));
    
    return c.json({
      ok: true,
      data: validShortcuts,
      is_default: false,
    });
    
  } catch (error: any) {
    return c.json({
      ok: false,
      error: 'Internal server error',
      detail: error.message,
    }, 500);
  }
}

/**
 * Update merchant's shortcuts
 * PUT /secure/shortcuts
 */
export async function updateMerchantShortcuts(c: ShortcutsContext) {
  try {
    const profileId = c.get('profileId');
    const body = await c.req.json();
    
    const { shortcuts } = body; // [{key, title, route, iconKey, enabled, order}]
    
    if (!shortcuts || !Array.isArray(shortcuts)) {
      return c.json({
        ok: false,
        error: 'Shortcuts array required',
      }, 400);
    }
    
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
        ok: false,
        error: 'Store not found',
      }, 404);
    }
    
    const merchantId = merchants[0].id;
    
    // Validate shortcuts against available ones
    const availableResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/available_shortcuts?is_enabled=eq.true&select=*`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const available: any[] = await availableResponse.json();
    const availableMap = new Map(available.map(a => [a.key, a]));
    
    // Validate and enrich shortcuts
    const validShortcuts = shortcuts
      .filter((s: any) => availableMap.has(s.key))
      .map((s: any, index: number) => {
        const original = availableMap.get(s.key)!;
        return {
          key: s.key,
          title: s.title || original.title_ar,
          route: original.route, // Always use original route
          iconKey: original.icon_key, // Always use original icon
          enabled: s.enabled !== false,
          order: s.order ?? index,
        };
      });
    
    // Check if settings exist
    const existingResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/store_settings?store_id=eq.${merchantId}&select=id`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const existing: any[] = await existingResponse.json();
    
    let result;
    
    if (existing && existing.length > 0) {
      // Update existing
      const updateResponse = await fetch(
        `${c.env.SUPABASE_URL}/rest/v1/store_settings?store_id=eq.${merchantId}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({
            shortcuts: validShortcuts,
            updated_at: new Date().toISOString(),
          }),
        }
      );
      
      result = await updateResponse.json();
    } else {
      // Create new
      const insertResponse = await fetch(
        `${c.env.SUPABASE_URL}/rest/v1/store_settings`,
        {
          method: 'POST',
          headers: {
            'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({
            store_id: merchantId,
            shortcuts: validShortcuts,
          }),
        }
      );
      
      result = await insertResponse.json();
    }
    
    // Create audit log
    await createAuditLog(c.env, {
      merchant_id: merchantId,
      actor_user_id: profileId,
      action: 'shortcut_reorder',
      entity_type: 'shortcut',
      entity_id: null,
      meta: {
        shortcuts_count: validShortcuts.length,
      },
    });
    
    return c.json({
      ok: true,
      data: validShortcuts,
      message: 'تم تحديث الاختصارات بنجاح',
    });
    
  } catch (error: any) {
    return c.json({
      ok: false,
      error: 'Internal server error',
      detail: error.message,
    }, 500);
  }
}

/**
 * Add a shortcut
 * POST /secure/shortcuts
 */
export async function addShortcut(c: ShortcutsContext) {
  try {
    const profileId = c.get('profileId');
    const body = await c.req.json();
    
    const { key } = body;
    
    if (!key) {
      return c.json({
        ok: false,
        error: 'Shortcut key required',
      }, 400);
    }
    
    // Get available shortcut
    const availableResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/available_shortcuts?key=eq.${key}&is_enabled=eq.true&select=*`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const available: any[] = await availableResponse.json();
    
    if (!available || available.length === 0) {
      return c.json({
        ok: false,
        error: 'Invalid shortcut key',
      }, 400);
    }
    
    const shortcutTemplate = available[0];
    
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
        ok: false,
        error: 'Store not found',
      }, 404);
    }
    
    const merchantId = merchants[0].id;
    
    // Get current shortcuts
    const settingsResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/store_settings?store_id=eq.${merchantId}&select=id,shortcuts`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const settings: any[] = await settingsResponse.json();
    const currentShortcuts = settings?.[0]?.shortcuts || [];
    
    // Check if already exists
    if (currentShortcuts.some((s: any) => s.key === key)) {
      return c.json({
        ok: false,
        error: 'Shortcut already exists',
        message: 'هذا الاختصار موجود بالفعل',
      }, 409);
    }
    
    // Add new shortcut
    const newShortcut = {
      key: shortcutTemplate.key,
      title: shortcutTemplate.title_ar,
      route: shortcutTemplate.route,
      iconKey: shortcutTemplate.icon_key,
      enabled: true,
      order: currentShortcuts.length,
    };
    
    const updatedShortcuts = [...currentShortcuts, newShortcut];
    
    // Save
    if (settings && settings.length > 0) {
      await fetch(
        `${c.env.SUPABASE_URL}/rest/v1/store_settings?store_id=eq.${merchantId}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            shortcuts: updatedShortcuts,
            updated_at: new Date().toISOString(),
          }),
        }
      );
    } else {
      await fetch(
        `${c.env.SUPABASE_URL}/rest/v1/store_settings`,
        {
          method: 'POST',
          headers: {
            'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            store_id: merchantId,
            shortcuts: updatedShortcuts,
          }),
        }
      );
    }
    
    // Create audit log
    await createAuditLog(c.env, {
      merchant_id: merchantId,
      actor_user_id: profileId,
      action: 'shortcut_add',
      entity_type: 'shortcut',
      entity_id: null,
      meta: { added_key: key },
    });
    
    return c.json({
      ok: true,
      data: newShortcut,
      message: 'تمت إضافة الاختصار بنجاح',
    });
    
  } catch (error: any) {
    return c.json({
      ok: false,
      error: 'Internal server error',
      detail: error.message,
    }, 500);
  }
}

/**
 * Remove a shortcut
 * DELETE /secure/shortcuts/:key
 */
export async function removeShortcut(c: ShortcutsContext) {
  try {
    const profileId = c.get('profileId');
    const key = c.req.param('key');
    
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
        ok: false,
        error: 'Store not found',
      }, 404);
    }
    
    const merchantId = merchants[0].id;
    
    // Get current shortcuts
    const settingsResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/store_settings?store_id=eq.${merchantId}&select=shortcuts`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const settings: any[] = await settingsResponse.json();
    const currentShortcuts = settings?.[0]?.shortcuts || [];
    
    // Remove shortcut
    const updatedShortcuts = currentShortcuts
      .filter((s: any) => s.key !== key)
      .map((s: any, index: number) => ({ ...s, order: index }));
    
    // Save
    await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/store_settings?store_id=eq.${merchantId}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shortcuts: updatedShortcuts,
          updated_at: new Date().toISOString(),
        }),
      }
    );
    
    // Create audit log
    await createAuditLog(c.env, {
      merchant_id: merchantId,
      actor_user_id: profileId,
      action: 'shortcut_remove',
      entity_type: 'shortcut',
      entity_id: null,
      meta: { removed_key: key },
    });
    
    return c.json({
      ok: true,
      data: updatedShortcuts,
      message: 'تم حذف الاختصار بنجاح',
    });
    
  } catch (error: any) {
    return c.json({
      ok: false,
      error: 'Internal server error',
      detail: error.message,
    }, 500);
  }
}

/**
 * Get default shortcuts
 */
async function getDefaultShortcuts(env: Env): Promise<any[]> {
  const defaultKeys = ['add_product', 'view_orders', 'boost_store', 'view_inventory', 'marketing', 'mbuy_studio'];
  
  const response = await fetch(
    `${env.SUPABASE_URL}/rest/v1/available_shortcuts?key=in.(${defaultKeys.map(k => `"${k}"`).join(',')})&is_enabled=eq.true&select=*&order=sort_order.asc`,
    {
      headers: {
        'apikey': env.SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
    }
  );
  
  const available: any[] = await response.json();
  
  return available.map((a, index) => ({
    key: a.key,
    title: a.title_ar,
    route: a.route,
    iconKey: a.icon_key,
    enabled: true,
    order: index,
  }));
}


