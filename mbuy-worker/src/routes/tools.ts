/**
 * Generation Tools Routes - API endpoints لأدوات التوليد والتحرير
 */

import { Hono } from 'hono';
import type {
  EditToolType,
  GenerateToolType,
  EDIT_TOOLS,
  GENERATE_TOOLS,
  RemoveBackgroundRequest,
  EnhanceQualityRequest,
  ResizeRequest,
  TrimVideoRequest,
  GenerateProductImagesRequest,
  GenerateBannerRequest,
  GenerateAnimatedImageRequest,
  GenerateShortVideoRequest,
  GenerateLogoRequest,
  GenerateLandingPageRequest,
} from '../types/tools.types';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  OPENROUTER_API_KEY: string;
  FAL_AI_API_KEY: string;
  ELEVENLABS_API_KEY: string;
  REPLICATE_API_KEY: string;
  DID_API_KEY: string;
  R2_BUCKET: R2Bucket;
  AI: any;
}

interface Variables {
  userId: string;
  storeId: string;
}

const tools = new Hono<{ Bindings: Env; Variables: Variables }>();

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
      'Prefer': method === 'POST' ? 'return=representation' : 'return=minimal',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return response;
}

async function checkCredits(env: Env, userId: string, required: number) {
  const response = await supabaseRequest(
    env,
    `user_credits?user_id=eq.${userId}`
  );
  const data = await response.json() as { balance: number }[];
  const balance = data[0]?.balance || 0;
  return { hasEnough: balance >= required, balance };
}

async function deductCredits(env: Env, userId: string, amount: number) {
  return supabaseRequest(env, 'rpc/deduct_credits', 'POST', {
    p_user_id: userId,
    p_amount: amount,
  });
}

async function saveAsset(env: Env, userId: string, storeId: string, asset: any) {
  return supabaseRequest(env, 'studio_assets', 'POST', {
    user_id: userId,
    store_id: storeId,
    ...asset,
  });
}

// =====================================================
// Tool Definitions Endpoints
// =====================================================

// الحصول على أدوات التحرير
tools.get('/edit', async (c) => {
  const { EDIT_TOOLS } = await import('../types/tools.types');
  return c.json({
    success: true,
    tools: EDIT_TOOLS,
  });
});

// الحصول على أدوات التوليد
tools.get('/generate', async (c) => {
  const { GENERATE_TOOLS } = await import('../types/tools.types');
  return c.json({
    success: true,
    tools: GENERATE_TOOLS,
  });
});

// =====================================================
// Edit Tools Endpoints
// =====================================================

// إزالة الخلفية
tools.post('/edit/remove-background', async (c) => {
  const userId = c.get('userId');
  const storeId = c.get('storeId');
  const body = await c.req.json<RemoveBackgroundRequest>();
  
  const creditCost = 1;
  const creditCheck = await checkCredits(c.env, userId, creditCost);
  
  if (!creditCheck.hasEnough) {
    return c.json({
      error: 'Insufficient credits',
      code: 'INSUFFICIENT_CREDITS',
      required: creditCost,
      balance: creditCheck.balance,
    }, 402);
  }
  
  try {
    const startTime = Date.now();
    
    // استخدام FAL.AI لإزالة الخلفية
    const response = await fetch('https://fal.run/fal-ai/birefnet', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${c.env.FAL_AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: body.image_url,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to remove background');
    }
    
    const result = await response.json() as { image: { url: string } };
    
    // خصم الرصيد
    await deductCredits(c.env, userId, creditCost);
    
    // حفظ الأصل
    await saveAsset(c.env, userId, storeId, {
      asset_type: 'image',
      source: 'ai_generated',
      url: result.image.url,
      ai_prompt: 'remove_background',
      ai_cost_credits: creditCost,
    });
    
    return c.json({
      success: true,
      result_url: result.image.url,
      processing_time_ms: Date.now() - startTime,
      credits_used: creditCost,
    });
  } catch (error: any) {
    console.error('Remove background error:', error);
    return c.json({
      error: 'Failed to remove background',
      details: error.message,
    }, 500);
  }
});

// تحسين الجودة
tools.post('/edit/enhance-quality', async (c) => {
  const userId = c.get('userId');
  const storeId = c.get('storeId');
  const body = await c.req.json<EnhanceQualityRequest>();
  
  const creditCost = 2;
  const creditCheck = await checkCredits(c.env, userId, creditCost);
  
  if (!creditCheck.hasEnough) {
    return c.json({
      error: 'Insufficient credits',
      code: 'INSUFFICIENT_CREDITS',
    }, 402);
  }
  
  try {
    const startTime = Date.now();
    
    // استخدام FAL.AI للتحسين
    const response = await fetch('https://fal.run/fal-ai/clarity-upscaler', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${c.env.FAL_AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: body.media_url,
        scale: body.enhancement_level === 'strong' ? 4 : 2,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to enhance quality');
    }
    
    const result = await response.json() as { image: { url: string } };
    
    await deductCredits(c.env, userId, creditCost);
    
    await saveAsset(c.env, userId, storeId, {
      asset_type: body.media_type,
      source: 'ai_generated',
      url: result.image.url,
      ai_prompt: 'enhance_quality',
      ai_cost_credits: creditCost,
    });
    
    return c.json({
      success: true,
      result_url: result.image.url,
      processing_time_ms: Date.now() - startTime,
      credits_used: creditCost,
    });
  } catch (error: any) {
    console.error('Enhance quality error:', error);
    return c.json({
      error: 'Failed to enhance quality',
      details: error.message,
    }, 500);
  }
});

// تغيير الحجم
tools.post('/edit/resize', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json<ResizeRequest>();
  
  const creditCost = 1;
  const creditCheck = await checkCredits(c.env, userId, creditCost);
  
  if (!creditCheck.hasEnough) {
    return c.json({
      error: 'Insufficient credits',
      code: 'INSUFFICIENT_CREDITS',
    }, 402);
  }
  
  try {
    const startTime = Date.now();
    
    // استخدام Cloudflare Images Transform
    const transformedUrl = `${body.media_url}?width=${body.width}&height=${body.height}&fit=${body.maintain_aspect_ratio ? 'contain' : 'cover'}`;
    
    await deductCredits(c.env, userId, creditCost);
    
    return c.json({
      success: true,
      result_url: transformedUrl,
      width: body.width,
      height: body.height,
      processing_time_ms: Date.now() - startTime,
      credits_used: creditCost,
    });
  } catch (error: any) {
    return c.json({
      error: 'Failed to resize',
      details: error.message,
    }, 500);
  }
});

// قص الفيديو
tools.post('/edit/trim-video', async (c) => {
  const userId = c.get('userId');
  const storeId = c.get('storeId');
  const body = await c.req.json<TrimVideoRequest>();
  
  const creditCost = 1;
  const creditCheck = await checkCredits(c.env, userId, creditCost);
  
  if (!creditCheck.hasEnough) {
    return c.json({
      error: 'Insufficient credits',
      code: 'INSUFFICIENT_CREDITS',
    }, 402);
  }
  
  try {
    const startTime = Date.now();
    
    // استخدام Cloudflare Stream أو FFmpeg API
    // هذا placeholder - سيتم ربطه بـ n8n/FFmpeg
    
    await deductCredits(c.env, userId, creditCost);
    
    return c.json({
      success: true,
      result_url: body.video_url, // placeholder
      start_time_ms: body.start_time_ms,
      end_time_ms: body.end_time_ms,
      processing_time_ms: Date.now() - startTime,
      credits_used: creditCost,
      message: 'Video trimming queued for processing',
    });
  } catch (error: any) {
    return c.json({
      error: 'Failed to trim video',
      details: error.message,
    }, 500);
  }
});

// =====================================================
// Generate Tools Endpoints
// =====================================================

// توليد صور المنتجات
tools.post('/generate/product-images', async (c) => {
  const userId = c.get('userId');
  const storeId = c.get('storeId');
  const body = await c.req.json<GenerateProductImagesRequest>();
  
  const creditCost = 3 * (body.num_images || 4);
  const creditCheck = await checkCredits(c.env, userId, creditCost);
  
  if (!creditCheck.hasEnough) {
    return c.json({
      error: 'Insufficient credits',
      code: 'INSUFFICIENT_CREDITS',
      required: creditCost,
      balance: creditCheck.balance,
    }, 402);
  }
  
  try {
    const startTime = Date.now();
    
    // بناء الـ prompt
    const stylePrompts: Record<string, string> = {
      product_photo: 'professional product photography, studio lighting, white background',
      lifestyle: 'lifestyle product photography, natural setting, warm lighting',
      minimal: 'minimalist product shot, clean background, soft shadows',
      '3d_render': '3D rendered product, glossy finish, studio lighting, octane render',
      flat_lay: 'flat lay product photography, top down view, styled arrangement',
    };
    
    const backgroundPrompts: Record<string, string> = {
      white: 'pure white background',
      gradient: 'soft gradient background',
      scene: 'contextual scene background',
      transparent: 'transparent background',
    };
    
    const prompt = `${body.product_name}, ${body.product_description || ''}, ${stylePrompts[body.style]}, ${backgroundPrompts[body.background || 'white']}, high quality, 4K`;
    
    // توليد الصور باستخدام FAL.AI
    const response = await fetch('https://fal.run/fal-ai/flux/schnell', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${c.env.FAL_AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        num_images: body.num_images || 4,
        image_size: body.aspect_ratio === '16:9' 
          ? { width: 1344, height: 768 }
          : body.aspect_ratio === '9:16'
          ? { width: 768, height: 1344 }
          : { width: 1024, height: 1024 },
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate images');
    }
    
    const result = await response.json() as { images: { url: string; width: number; height: number }[] };
    
    await deductCredits(c.env, userId, creditCost);
    
    // حفظ الأصول
    for (const image of result.images) {
      await saveAsset(c.env, userId, storeId, {
        asset_type: 'image',
        source: 'ai_generated',
        url: image.url,
        width: image.width,
        height: image.height,
        ai_prompt: prompt,
        ai_model: 'flux-schnell',
        ai_cost_credits: 3,
        metadata: { product_id: body.product_id, style: body.style },
      });
    }
    
    return c.json({
      success: true,
      results: result.images.map((img, index) => ({
        id: `img_${Date.now()}_${index}`,
        url: img.url,
        type: 'image',
        width: img.width,
        height: img.height,
      })),
      credits_used: creditCost,
      processing_time_ms: Date.now() - startTime,
    });
  } catch (error: any) {
    console.error('Generate product images error:', error);
    return c.json({
      error: 'Failed to generate product images',
      details: error.message,
    }, 500);
  }
});

// توليد بانر
tools.post('/generate/banner', async (c) => {
  const userId = c.get('userId');
  const storeId = c.get('storeId');
  const body = await c.req.json<GenerateBannerRequest>();
  
  const creditCost = 2;
  const creditCheck = await checkCredits(c.env, userId, creditCost);
  
  if (!creditCheck.hasEnough) {
    return c.json({
      error: 'Insufficient credits',
      code: 'INSUFFICIENT_CREDITS',
    }, 402);
  }
  
  try {
    const startTime = Date.now();
    
    // أحجام البانر
    const sizes: Record<string, { width: number; height: number }> = {
      web_header: { width: 1920, height: 600 },
      web_sidebar: { width: 300, height: 600 },
      social_post: { width: 1080, height: 1080 },
      social_story: { width: 1080, height: 1920 },
    };
    
    const size = sizes[body.size] || { width: body.custom_width || 1200, height: body.custom_height || 630 };
    
    const prompt = `promotional banner design, "${body.title}", ${body.subtitle ? `"${body.subtitle}",` : ''} ${body.background_style} background, modern design, high quality, professional`;
    
    const response = await fetch('https://fal.run/fal-ai/flux/schnell', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${c.env.FAL_AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        image_size: size,
        num_images: 1,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate banner');
    }
    
    const result = await response.json() as { images: { url: string }[] };
    
    await deductCredits(c.env, userId, creditCost);
    
    await saveAsset(c.env, userId, storeId, {
      asset_type: 'image',
      source: 'ai_generated',
      url: result.images[0].url,
      width: size.width,
      height: size.height,
      ai_prompt: prompt,
      ai_model: 'flux-schnell',
      ai_cost_credits: creditCost,
      metadata: { type: 'banner', size: body.size },
    });
    
    return c.json({
      success: true,
      results: [{
        id: `banner_${Date.now()}`,
        url: result.images[0].url,
        type: 'image',
        width: size.width,
        height: size.height,
      }],
      credits_used: creditCost,
      processing_time_ms: Date.now() - startTime,
    });
  } catch (error: any) {
    return c.json({
      error: 'Failed to generate banner',
      details: error.message,
    }, 500);
  }
});

// توليد صورة متحركة (GIF)
tools.post('/generate/animated-image', async (c) => {
  const userId = c.get('userId');
  const storeId = c.get('storeId');
  const body = await c.req.json<GenerateAnimatedImageRequest>();
  
  const creditCost = 3;
  const creditCheck = await checkCredits(c.env, userId, creditCost);
  
  if (!creditCheck.hasEnough) {
    return c.json({
      error: 'Insufficient credits',
      code: 'INSUFFICIENT_CREDITS',
    }, 402);
  }
  
  try {
    const startTime = Date.now();
    
    // استخدام Replicate أو FAL.AI للأنيميشن
    // هذا placeholder - سيتم ربطه بالـ API المناسب
    
    await deductCredits(c.env, userId, creditCost);
    
    return c.json({
      success: true,
      results: [{
        id: `anim_${Date.now()}`,
        url: body.base_image_url, // placeholder
        type: body.output_format || 'gif',
        duration_ms: body.duration_ms || 2000,
      }],
      credits_used: creditCost,
      processing_time_ms: Date.now() - startTime,
      message: 'Animation generation queued',
    });
  } catch (error: any) {
    return c.json({
      error: 'Failed to generate animated image',
      details: error.message,
    }, 500);
  }
});

// توليد فيديو قصير
tools.post('/generate/short-video', async (c) => {
  const userId = c.get('userId');
  const storeId = c.get('storeId');
  const body = await c.req.json<GenerateShortVideoRequest>();
  
  const creditCost = 8;
  const creditCheck = await checkCredits(c.env, userId, creditCost);
  
  if (!creditCheck.hasEnough) {
    return c.json({
      error: 'Insufficient credits',
      code: 'INSUFFICIENT_CREDITS',
      required: creditCost,
      balance: creditCheck.balance,
    }, 402);
  }
  
  try {
    const startTime = Date.now();
    
    // إنشاء سجل الطلب
    const jobRes = await supabaseRequest(c.env, 'studio_jobs', 'POST', {
      user_id: userId,
      store_id: storeId,
      job_type: 'short_video',
      status: 'processing',
      input_data: body,
      credits_cost: creditCost,
    });
    
    const jobs = await jobRes.json() as { id: string }[];
    const jobId = jobs[0].id;
    
    await deductCredits(c.env, userId, creditCost);
    
    // بدء المعالجة (async)
    // سيتم معالجتها عبر n8n workflow
    
    return c.json({
      success: true,
      job_id: jobId,
      status: 'processing',
      estimated_time_seconds: 45,
      credits_used: creditCost,
      processing_time_ms: Date.now() - startTime,
    });
  } catch (error: any) {
    return c.json({
      error: 'Failed to generate short video',
      details: error.message,
    }, 500);
  }
});

// توليد شعار
tools.post('/generate/logo', async (c) => {
  const userId = c.get('userId');
  const storeId = c.get('storeId');
  const body = await c.req.json<GenerateLogoRequest>();
  
  const creditCost = 5;
  const creditCheck = await checkCredits(c.env, userId, creditCost);
  
  if (!creditCheck.hasEnough) {
    return c.json({
      error: 'Insufficient credits',
      code: 'INSUFFICIENT_CREDITS',
    }, 402);
  }
  
  try {
    const startTime = Date.now();
    
    const stylePrompts: Record<string, string> = {
      modern: 'modern minimalist logo, clean lines, contemporary',
      classic: 'classic elegant logo, timeless design',
      playful: 'playful fun logo, creative colorful',
      minimal: 'ultra minimal logo, simple iconic',
      geometric: 'geometric logo, shapes, abstract',
    };
    
    const prompt = `professional logo design for "${body.brand_name}", ${body.industry ? `${body.industry} industry,` : ''} ${stylePrompts[body.style]}, ${body.include_icon ? 'with icon,' : 'text only,'} vector style, high quality, white background`;
    
    const response = await fetch('https://fal.run/fal-ai/flux/schnell', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${c.env.FAL_AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        num_images: body.num_variations || 4,
        image_size: { width: 1024, height: 1024 },
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate logo');
    }
    
    const result = await response.json() as { images: { url: string }[] };
    
    await deductCredits(c.env, userId, creditCost);
    
    // حفظ الأصول
    for (const image of result.images) {
      await saveAsset(c.env, userId, storeId, {
        asset_type: 'logo',
        source: 'ai_generated',
        url: image.url,
        width: 1024,
        height: 1024,
        ai_prompt: prompt,
        ai_model: 'flux-schnell',
        ai_cost_credits: creditCost / result.images.length,
        metadata: { brand_name: body.brand_name, style: body.style },
      });
    }
    
    return c.json({
      success: true,
      results: result.images.map((img, index) => ({
        id: `logo_${Date.now()}_${index}`,
        url: img.url,
        type: 'image',
        width: 1024,
        height: 1024,
      })),
      credits_used: creditCost,
      processing_time_ms: Date.now() - startTime,
    });
  } catch (error: any) {
    return c.json({
      error: 'Failed to generate logo',
      details: error.message,
    }, 500);
  }
});

// =====================================================
// Templates Endpoints
// =====================================================

// الحصول على القوالب المتاحة
tools.get('/templates', async (c) => {
  const category = c.req.query('category');
  const type = c.req.query('type'); // image, video, social
  
  let url = `design_templates?is_active=eq.true&order=usage_count.desc`;
  
  if (category) {
    url += `&category=eq.${category}`;
  }
  if (type) {
    url += `&type=eq.${type}`;
  }
  
  const response = await supabaseRequest(c.env, url);
  const templates = await response.json();
  
  return c.json({
    success: true,
    templates,
  });
});

// استخدام قالب
tools.post('/templates/:id/use', async (c) => {
  const userId = c.get('userId');
  const storeId = c.get('storeId');
  const id = c.req.param('id');
  const body = await c.req.json<{ customizations?: Record<string, any> }>();
  
  // جلب القالب
  const templateRes = await supabaseRequest(
    c.env,
    `design_templates?id=eq.${id}`
  );
  const templates = await templateRes.json() as any[];
  
  if (templates.length === 0) {
    return c.json({ error: 'Template not found' }, 404);
  }
  
  const template = templates[0];
  
  // التحقق من الرصيد (إذا كان القالب مدفوع)
  if (template.credits_cost > 0) {
    const creditCheck = await checkCredits(c.env, userId, template.credits_cost);
    if (!creditCheck.hasEnough) {
      return c.json({
        error: 'Insufficient credits',
        code: 'INSUFFICIENT_CREDITS',
      }, 402);
    }
    await deductCredits(c.env, userId, template.credits_cost);
  }
  
  // زيادة عداد الاستخدام
  await supabaseRequest(
    c.env,
    `design_templates?id=eq.${id}`,
    'PATCH',
    { usage_count: template.usage_count + 1 }
  );
  
  // إنشاء نسخة مخصصة
  const customizedTemplate = {
    ...template,
    customizations: body.customizations || {},
  };
  
  return c.json({
    success: true,
    template: customizedTemplate,
    credits_used: template.credits_cost || 0,
  });
});

// =====================================================
// Job Status Endpoints
// =====================================================

// التحقق من حالة job
tools.get('/jobs/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  
  const response = await supabaseRequest(
    c.env,
    `studio_jobs?id=eq.${id}&user_id=eq.${userId}`
  );
  const jobs = await response.json() as any[];
  
  if (jobs.length === 0) {
    return c.json({ error: 'Job not found' }, 404);
  }
  
  return c.json({
    success: true,
    job: jobs[0],
  });
});

// الحصول على الأصول المحفوظة
tools.get('/assets', async (c) => {
  const userId = c.get('userId');
  const type = c.req.query('type'); // image, video, audio, logo
  const source = c.req.query('source'); // ai_generated, uploaded
  const limit = parseInt(c.req.query('limit') || '50');
  
  let url = `studio_assets?user_id=eq.${userId}&order=created_at.desc&limit=${limit}`;
  
  if (type) {
    url += `&asset_type=eq.${type}`;
  }
  if (source) {
    url += `&source=eq.${source}`;
  }
  
  const response = await supabaseRequest(c.env, url);
  const assets = await response.json();
  
  return c.json({
    success: true,
    assets,
  });
});

// حذف أصل
tools.delete('/assets/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  
  const response = await supabaseRequest(
    c.env,
    `studio_assets?id=eq.${id}&user_id=eq.${userId}`,
    'DELETE'
  );
  
  if (!response.ok) {
    return c.json({ error: 'Failed to delete asset' }, 500);
  }
  
  return c.json({ success: true });
});

export default tools;
