/**
 * Platform Settings Routes - إعدادات المنصة
 * 
 * Endpoints:
 * - GET /admin/settings - جلب جميع الإعدادات
 * - GET /admin/settings/:key - جلب إعداد محدد
 * - PUT /admin/settings - تحديث إعدادات متعددة
 * - PUT /admin/settings/:key - تحديث إعداد محدد
 */

import { Hono } from 'hono';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

interface Variables {
  userId: string;
  userType: string;
}

interface PlatformSetting {
  id: string;
  key: string;
  value: any;
  description?: string;
  category?: string;
  created_at: string;
  updated_at: string;
}

const settingsRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

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
      'Prefer': method === 'POST' ? 'return=representation' : 
                method === 'PATCH' ? 'return=representation' : 'return=minimal',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Supabase error: ${error}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

// =====================================================
// GET /admin/settings - جلب جميع الإعدادات
// =====================================================

settingsRoutes.get('/', async (c) => {
  try {
    const category = c.req.query('category');
    
    let query = 'platform_settings?select=*&order=category,key';
    if (category) {
      query += `&category=eq.${category}`;
    }

    const settings = await supabaseRequest(c.env, query);

    // تحويل إلى كائن key-value للسهولة
    const settingsMap: Record<string, any> = {};
    const settingsList: PlatformSetting[] = settings || [];
    
    for (const setting of settingsList) {
      settingsMap[setting.key] = setting.value;
    }

    return c.json({
      success: true,
      data: settingsMap,
      settings: settingsList, // القائمة الكاملة مع التفاصيل
    });
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// =====================================================
// GET /admin/settings/:key - جلب إعداد محدد
// =====================================================

settingsRoutes.get('/:key', async (c) => {
  try {
    const key = c.req.param('key');
    
    const settings = await supabaseRequest(
      c.env,
      `platform_settings?key=eq.${key}&limit=1`
    );

    if (!settings || settings.length === 0) {
      return c.json({ success: false, error: 'Setting not found' }, 404);
    }

    return c.json({
      success: true,
      data: settings[0],
    });
  } catch (error: any) {
    console.error('Error fetching setting:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// =====================================================
// PUT /admin/settings - تحديث إعدادات متعددة
// =====================================================

settingsRoutes.put('/', async (c) => {
  try {
    const body = await c.req.json();
    const updates: Record<string, any> = body.settings || body;

    const results: { key: string; success: boolean; error?: string }[] = [];

    for (const [key, value] of Object.entries(updates)) {
      try {
        // تحقق من وجود الإعداد
        const existing = await supabaseRequest(
          c.env,
          `platform_settings?key=eq.${key}&limit=1`
        );

        if (existing && existing.length > 0) {
          // تحديث
          await supabaseRequest(
            c.env,
            `platform_settings?key=eq.${key}`,
            'PATCH',
            { value, updated_at: new Date().toISOString() }
          );
        } else {
          // إنشاء جديد
          await supabaseRequest(
            c.env,
            'platform_settings',
            'POST',
            { key, value, category: 'general' }
          );
        }
        
        results.push({ key, success: true });
      } catch (err: any) {
        results.push({ key, success: false, error: err.message });
      }
    }

    return c.json({
      success: true,
      message: 'Settings updated',
      results,
    });
  } catch (error: any) {
    console.error('Error updating settings:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// =====================================================
// PUT /admin/settings/:key - تحديث إعداد محدد
// =====================================================

settingsRoutes.put('/:key', async (c) => {
  try {
    const key = c.req.param('key');
    const body = await c.req.json();
    const { value, description, category } = body;

    // تحقق من وجود الإعداد
    const existing = await supabaseRequest(
      c.env,
      `platform_settings?key=eq.${key}&limit=1`
    );

    const updateData: any = {
      value,
      updated_at: new Date().toISOString(),
    };
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;

    if (existing && existing.length > 0) {
      // تحديث
      await supabaseRequest(
        c.env,
        `platform_settings?key=eq.${key}`,
        'PATCH',
        updateData
      );
    } else {
      // إنشاء جديد
      await supabaseRequest(
        c.env,
        'platform_settings',
        'POST',
        { key, value, description, category: category || 'general' }
      );
    }

    return c.json({
      success: true,
      message: `Setting '${key}' updated`,
    });
  } catch (error: any) {
    console.error('Error updating setting:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// =====================================================
// DELETE /admin/settings/:key - حذف إعداد
// =====================================================

settingsRoutes.delete('/:key', async (c) => {
  try {
    const key = c.req.param('key');

    await supabaseRequest(
      c.env,
      `platform_settings?key=eq.${key}`,
      'DELETE'
    );

    return c.json({
      success: true,
      message: `Setting '${key}' deleted`,
    });
  } catch (error: any) {
    console.error('Error deleting setting:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// =====================================================
// POST /admin/settings/seed - إدخال الإعدادات الافتراضية
// =====================================================

settingsRoutes.post('/seed', async (c) => {
  try {
    const defaultSettings = [
      // === Feature Flags ===
      { key: 'maintenance_mode', value: false, description: 'وضع الصيانة', category: 'features' },
      { key: 'registration_enabled', value: true, description: 'تسجيل المستخدمين', category: 'features' },
      { key: 'merchant_registration_enabled', value: true, description: 'تسجيل التجار', category: 'features' },
      { key: 'guest_checkout_enabled', value: true, description: 'الشراء كضيف', category: 'features' },
      { key: 'enable_boost_feature', value: true, description: 'ميزة دعم الظهور', category: 'features' },
      { key: 'enable_studio_feature', value: true, description: 'استوديو AI', category: 'features' },
      { key: 'enable_wallet_feature', value: false, description: 'المحفظة', category: 'features' },
      { key: 'enable_coupons_feature', value: false, description: 'الكوبونات', category: 'features' },
      { key: 'enable_loyalty_feature', value: false, description: 'برنامج الولاء', category: 'features' },
      
      // === General ===
      { key: 'platform_name', value: 'MBUY', description: 'اسم المنصة', category: 'general' },
      { key: 'platform_name_ar', value: 'امباي', description: 'اسم المنصة بالعربي', category: 'general' },
      { key: 'support_email', value: 'support@mbuy.app', description: 'بريد الدعم', category: 'general' },
      { key: 'support_phone', value: '+966500000000', description: 'هاتف الدعم', category: 'general' },
      { key: 'support_whatsapp', value: '966500000000', description: 'واتساب الدعم', category: 'general' },
      { key: 'default_currency', value: 'SAR', description: 'العملة الافتراضية', category: 'general' },
      { key: 'default_language', value: 'ar', description: 'اللغة الافتراضية', category: 'general' },
      
      // === Appearance ===
      { key: 'primary_color', value: '00BCD4', description: 'اللون الرئيسي', category: 'appearance' },
      { key: 'secondary_color', value: '0A1628', description: 'اللون الثانوي', category: 'appearance' },
      { key: 'accent_color', value: 'FF9800', description: 'لون التمييز', category: 'appearance' },
      
      // === Notifications ===
      { key: 'email_notifications', value: true, description: 'إشعارات البريد', category: 'notifications' },
      { key: 'sms_notifications', value: true, description: 'إشعارات SMS', category: 'notifications' },
      { key: 'push_notifications', value: true, description: 'الإشعارات الفورية', category: 'notifications' },
      
      // === Security ===
      { key: 'two_factor_required', value: false, description: 'المصادقة الثنائية', category: 'security' },
      { key: 'session_timeout', value: 30, description: 'مهلة الجلسة (دقيقة)', category: 'security' },
      { key: 'max_login_attempts', value: 5, description: 'محاولات الدخول', category: 'security' },
      
      // === Limits ===
      { key: 'min_order_amount', value: 10, description: 'الحد الأدنى للطلب', category: 'limits' },
      { key: 'max_product_images', value: 10, description: 'أقصى صور للمنتج', category: 'limits' },
      { key: 'max_products_per_store', value: 1000, description: 'حد المنتجات', category: 'limits' },
      { key: 'free_boost_days', value: 3, description: 'أيام Boost المجانية', category: 'limits' },
      { key: 'points_per_sar', value: 10, description: 'نقاط لكل ريال', category: 'limits' },
      
      // === URLs ===
      { key: 'terms_url', value: 'https://mbuy.pro/terms', description: 'رابط الشروط', category: 'urls' },
      { key: 'privacy_url', value: 'https://mbuy.pro/privacy', description: 'رابط الخصوصية', category: 'urls' },
      { key: 'help_url', value: 'https://mbuy.pro/help', description: 'رابط المساعدة', category: 'urls' },
      
      // === Announcements ===
      { key: 'announcement_enabled', value: false, description: 'تفعيل الإعلان', category: 'announcements' },
      { key: 'announcement_text', value: '', description: 'نص الإعلان', category: 'announcements' },
      { key: 'maintenance_message', value: 'التطبيق تحت الصيانة، سنعود قريباً', description: 'رسالة الصيانة', category: 'announcements' },
    ];

    let inserted = 0;
    let skipped = 0;

    for (const setting of defaultSettings) {
      try {
        // تحقق من وجود الإعداد
        const existing = await supabaseRequest(
          c.env,
          `platform_settings?key=eq.${setting.key}&limit=1`
        );

        if (!existing || existing.length === 0) {
          await supabaseRequest(c.env, 'platform_settings', 'POST', setting);
          inserted++;
        } else {
          skipped++;
        }
      } catch (err) {
        console.error(`Error inserting ${setting.key}:`, err);
      }
    }

    return c.json({
      success: true,
      message: `Seeded ${inserted} settings, skipped ${skipped} existing`,
      total: defaultSettings.length,
    });
  } catch (error: any) {
    console.error('Error seeding settings:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default settingsRoutes;
