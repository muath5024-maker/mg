import { Hono } from 'hono';

type RouteContext = { Variables: { user: any }; Bindings: { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string; AI?: any } };
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const app = new Hono<RouteContext>();

// Helper to get Supabase client
function getSupabase(c: any): SupabaseClient {
  return createClient(
    c.env.SUPABASE_URL,
    c.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// Helper to get store_id from user
async function getStoreId(supabase: SupabaseClient, userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('merchants')
    .select('id')
    .eq('id', userId)
    .single();
  return data?.id || null;
}

// ==================== DIGITAL PRODUCTS ====================

// Get all digital products
app.get('/', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  const { data, error } = await supabase
    .from('digital_products')
    .select(`
      *,
      product:products(id, name, price, image_url, status)
    `)
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

// Get single digital product
app.get('/:id', async (c) => {
  const supabase = getSupabase(c);
  const productId = c.req.param('id');

  const { data, error } = await supabase
    .from('digital_products')
    .select(`
      *,
      product:products(*),
      course:digital_courses(
        *,
        lessons:course_lessons(*)
      )
    `)
    .eq('id', productId)
    .single();

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

// Create digital product
app.post('/', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);
  const body = await c.req.json();

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  const { data, error } = await supabase
    .from('digital_products')
    .insert({
      product_id: body.product_id,
      store_id: storeId,
      digital_type: body.digital_type,
      file_url: body.file_url,
      file_name: body.file_name,
      file_size: body.file_size,
      file_type: body.file_type,
      additional_files: body.additional_files || [],
      license_type: body.license_type || 'personal',
      license_text: body.license_text,
      max_downloads: body.max_downloads,
      download_expiry_days: body.download_expiry_days,
      version: body.version,
      release_notes: body.release_notes,
      requirements: body.requirements
    })
    .select()
    .single();

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

// Update digital product
app.put('/:id', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);
  const productId = c.req.param('id');
  const body = await c.req.json();

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString()
  };

  const fields = [
    'digital_type', 'file_url', 'file_name', 'file_size', 'file_type',
    'additional_files', 'license_type', 'license_text', 'max_downloads',
    'download_expiry_days', 'version', 'release_notes', 'requirements'
  ];

  for (const field of fields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field];
    }
  }

  const { data, error } = await supabase
    .from('digital_products')
    .update(updateData)
    .eq('id', productId)
    .eq('store_id', storeId)
    .select()
    .single();

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

// Delete digital product
app.delete('/:id', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);
  const productId = c.req.param('id');

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  const { error } = await supabase
    .from('digital_products')
    .delete()
    .eq('id', productId)
    .eq('store_id', storeId);

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true });
});

// ==================== COURSES ====================

// Create course for digital product
app.post('/:digitalProductId/course', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);
  const digitalProductId = c.req.param('digitalProductId');
  const body = await c.req.json();

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  const { data, error } = await supabase
    .from('digital_courses')
    .insert({
      digital_product_id: digitalProductId,
      store_id: storeId,
      total_duration: body.total_duration,
      level: body.level || 'beginner',
      language: body.language || 'ar',
      allow_preview: body.allow_preview !== false,
      preview_lessons: body.preview_lessons || 1,
      require_completion_order: body.require_completion_order || false,
      certificate_enabled: body.certificate_enabled || false
    })
    .select()
    .single();

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

// Add lesson to course
app.post('/courses/:courseId/lessons', async (c) => {
  const supabase = getSupabase(c);
  const courseId = c.req.param('courseId');
  const body = await c.req.json();

  const { data, error } = await supabase
    .from('course_lessons')
    .insert({
      course_id: courseId,
      title: body.title,
      description: body.description,
      content_type: body.content_type,
      content_url: body.content_url,
      content_data: body.content_data,
      duration: body.duration,
      section_name: body.section_name,
      sort_order: body.sort_order || 0,
      is_preview: body.is_preview || false,
      is_required: body.is_required !== false
    })
    .select()
    .single();

  if (error) return c.json({ ok: false, error: error.message }, 400);

  // Update lessons count
  await supabase.rpc('update_course_lessons_count', { p_course_id: courseId });

  return c.json({ ok: true, data });
});

// Update lesson
app.put('/lessons/:lessonId', async (c) => {
  const supabase = getSupabase(c);
  const lessonId = c.req.param('lessonId');
  const body = await c.req.json();

  const updateData: Record<string, unknown> = {};

  const fields = [
    'title', 'description', 'content_type', 'content_url', 'content_data',
    'duration', 'section_name', 'sort_order', 'is_preview', 'is_required'
  ];

  for (const field of fields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field];
    }
  }

  const { data, error } = await supabase
    .from('course_lessons')
    .update(updateData)
    .eq('id', lessonId)
    .select()
    .single();

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

// Delete lesson
app.delete('/lessons/:lessonId', async (c) => {
  const supabase = getSupabase(c);
  const lessonId = c.req.param('lessonId');

  // Get course_id first
  const { data: lesson } = await supabase
    .from('course_lessons')
    .select('course_id')
    .eq('id', lessonId)
    .single();

  const { error } = await supabase
    .from('course_lessons')
    .delete()
    .eq('id', lessonId);

  if (error) return c.json({ ok: false, error: error.message }, 400);

  // Update lessons count
  if (lesson) {
    await supabase.rpc('update_course_lessons_count', { p_course_id: lesson.course_id });
  }

  return c.json({ ok: true });
});

// ==================== DOWNLOADS ====================

// Get downloads list
app.get('/:digitalProductId/downloads', async (c) => {
  const supabase = getSupabase(c);
  const digitalProductId = c.req.param('digitalProductId');

  const { data, error } = await supabase
    .from('digital_downloads')
    .select('*')
    .eq('digital_product_id', digitalProductId)
    .order('created_at', { ascending: false });

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

// Create download link
app.post('/:digitalProductId/downloads', async (c) => {
  const supabase = getSupabase(c);
  const digitalProductId = c.req.param('digitalProductId');
  const body = await c.req.json();

  // Generate token
  const token = crypto.randomUUID() + crypto.randomUUID();

  // Get product details
  const { data: product } = await supabase
    .from('digital_products')
    .select('file_url, max_downloads, download_expiry_days')
    .eq('id', digitalProductId)
    .single();

  if (!product) {
    return c.json({ ok: false, error: 'Product not found' }, 404);
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (product.download_expiry_days || 30));

  const { data, error } = await supabase
    .from('digital_downloads')
    .insert({
      digital_product_id: digitalProductId,
      order_id: body.order_id,
      customer_id: body.customer_id,
      download_token: token,
      download_url: product.file_url,
      max_downloads: product.max_downloads || 5,
      expires_at: expiresAt.toISOString()
    })
    .select()
    .single();

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

// Verify and get download
app.get('/download/:token', async (c) => {
  const supabase = getSupabase(c);
  const token = c.req.param('token');

  const { data: download } = await supabase
    .from('digital_downloads')
    .select('*')
    .eq('download_token', token)
    .single();

  if (!download) {
    return c.json({ ok: false, error: 'Invalid download link' }, 404);
  }

  // Check status
  if (download.status !== 'active') {
    return c.json({ ok: false, error: 'Download link is not active' }, 400);
  }

  // Check expiry
  if (download.expires_at && new Date(download.expires_at) < new Date()) {
    await supabase
      .from('digital_downloads')
      .update({ status: 'expired' })
      .eq('id', download.id);
    return c.json({ ok: false, error: 'Download link has expired' }, 400);
  }

  // Check download count
  if (download.max_downloads && download.download_count >= download.max_downloads) {
    return c.json({ ok: false, error: 'Maximum downloads reached' }, 400);
  }

  // Record download
  await supabase
    .from('digital_downloads')
    .update({
      download_count: download.download_count + 1,
      first_download_at: download.first_download_at || new Date().toISOString(),
      last_download_at: new Date().toISOString()
    })
    .eq('id', download.id);

  return c.json({
    ok: true,
    data: {
      download_url: download.download_url,
      downloads_remaining: download.max_downloads ? download.max_downloads - download.download_count - 1 : null
    }
  });
});

// Revoke download
app.post('/downloads/:downloadId/revoke', async (c) => {
  const supabase = getSupabase(c);
  const downloadId = c.req.param('downloadId');

  const { data, error } = await supabase
    .from('digital_downloads')
    .update({ status: 'revoked' })
    .eq('id', downloadId)
    .select()
    .single();

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

// ==================== COURSE PROGRESS ====================

// Get course progress for customer
app.get('/courses/:courseId/progress/:customerId', async (c) => {
  const supabase = getSupabase(c);
  const courseId = c.req.param('courseId');
  const customerId = c.req.param('customerId');

  const { data: progress } = await supabase
    .from('course_progress')
    .select('*')
    .eq('course_id', courseId)
    .eq('customer_id', customerId)
    .single();

  const { data: lessonProgress } = await supabase
    .from('lesson_progress')
    .select(`
      *,
      lesson:course_lessons(id, title, sort_order)
    `)
    .eq('customer_id', customerId)
    .order('lesson(sort_order)');

  return c.json({
    ok: true,
    data: {
      course_progress: progress,
      lesson_progress: lessonProgress || []
    }
  });
});

// Update lesson progress
app.post('/lessons/:lessonId/progress', async (c) => {
  const supabase = getSupabase(c);
  const lessonId = c.req.param('lessonId');
  const body = await c.req.json();

  const { data, error } = await supabase
    .from('lesson_progress')
    .upsert({
      lesson_id: lessonId,
      customer_id: body.customer_id,
      status: body.status || 'in_progress',
      progress_percent: body.progress_percent || 0,
      current_position: body.current_position || 0,
      quiz_score: body.quiz_score,
      quiz_attempts: body.quiz_attempts,
      started_at: body.status ? new Date().toISOString() : undefined,
      completed_at: body.status === 'completed' ? new Date().toISOString() : undefined
    }, {
      onConflict: 'lesson_id,customer_id'
    })
    .select()
    .single();

  if (error) return c.json({ ok: false, error: error.message }, 400);

  // Update course progress
  const { data: lesson } = await supabase
    .from('course_lessons')
    .select('course_id')
    .eq('id', lessonId)
    .single();

  if (lesson) {
    // Simple progress update
    const { data: allLessons } = await supabase
      .from('course_lessons')
      .select('id')
      .eq('course_id', lesson.course_id)
      .eq('is_required', true);

    const { count: completedCount } = await supabase
      .from('lesson_progress')
      .select('*', { count: 'exact', head: true })
      .eq('customer_id', body.customer_id)
      .eq('status', 'completed')
      .in('lesson_id', allLessons?.map(l => l.id) || []);

    const totalLessons = allLessons?.length || 0;
    const progressPercent = totalLessons > 0 ? Math.round(((completedCount || 0) / totalLessons) * 100) : 0;

    await supabase
      .from('course_progress')
      .upsert({
        course_id: lesson.course_id,
        customer_id: body.customer_id,
        progress_percent: progressPercent,
        completed_lessons: completedCount || 0,
        total_lessons: totalLessons,
        status: progressPercent === 100 ? 'completed' : (completedCount || 0) > 0 ? 'in_progress' : 'not_started',
        last_lesson_id: lessonId,
        started_at: new Date().toISOString(),
        completed_at: progressPercent === 100 ? new Date().toISOString() : undefined
      }, {
        onConflict: 'course_id,customer_id'
      });
  }

  return c.json({ ok: true, data });
});

// ==================== SETTINGS ====================

// Get settings
app.get('/settings', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  const { data, error } = await supabase
    .from('digital_product_settings')
    .select('*')
    .eq('store_id', storeId)
    .single();

  if (error && error.code !== 'PGRST116') {
    return c.json({ ok: false, error: error.message }, 400);
  }

  return c.json({
    ok: true,
    data: data || {
      default_max_downloads: 5,
      default_download_expiry_days: 30,
      enable_drm: false,
      watermark_enabled: false,
      auto_deliver: true
    }
  });
});

// Update settings
app.put('/settings', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);
  const body = await c.req.json();

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  const { data, error } = await supabase
    .from('digital_product_settings')
    .upsert({
      store_id: storeId,
      default_max_downloads: body.default_max_downloads,
      default_download_expiry_days: body.default_download_expiry_days,
      enable_drm: body.enable_drm,
      watermark_enabled: body.watermark_enabled,
      watermark_text: body.watermark_text,
      auto_deliver: body.auto_deliver,
      delivery_email_template: body.delivery_email_template,
      certificate_template: body.certificate_template,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'store_id'
    })
    .select()
    .single();

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

// ==================== STATS ====================

// Get digital products stats
app.get('/stats/overview', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  // Total digital products
  const { count: totalProducts } = await supabase
    .from('digital_products')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId);

  // Total downloads
  const { data: downloads } = await supabase
    .from('digital_downloads')
    .select('download_count')
    .eq('digital_product_id', storeId);

  const totalDownloads = downloads?.reduce((sum, d) => sum + (d.download_count || 0), 0) || 0;

  // Active downloads
  const { count: activeDownloads } = await supabase
    .from('digital_downloads')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  // Products by type
  const { data: byType } = await supabase
    .from('digital_products')
    .select('digital_type')
    .eq('store_id', storeId);

  const typeCount: Record<string, number> = {};
  byType?.forEach(p => {
    typeCount[p.digital_type] = (typeCount[p.digital_type] || 0) + 1;
  });

  return c.json({
    ok: true,
    data: {
      total_products: totalProducts || 0,
      total_downloads: totalDownloads,
      active_downloads: activeDownloads || 0,
      products_by_type: typeCount
    }
  });
});

export default app;
