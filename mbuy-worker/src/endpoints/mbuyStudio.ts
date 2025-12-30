/**
 * MBUY Studio Endpoints
 * Handles AI content generation (images, videos, 3D models, voice)
 * Integrates with Cloudflare AI and NanoBanana
 */

import { Context } from 'hono';
import { Env, SupabaseAuthContext } from '../types';

// Type alias for authenticated context
type AuthContext = Context<{ Bindings: Env; Variables: SupabaseAuthContext }>;

// NanoBanana API Base URL
const NANO_BANANA_BASE_URL = 'https://api.nanobanana.com/v1';

// ============================================================================
// Helper: Process single product improvement
// ============================================================================
async function processProductImprovement(
  env: Env,
  studioId: string,
  product: any,
  mode: string,
  merchantId: string
) {
  try {
    console.log('[processProductImprovement] Processing:', product.id, mode);

    const imageUrl = product.main_image_url;

    // ========================
    // 1. Call Nano Banana API
    // ========================
    let nanoBananaPrompt = '';
    switch (mode) {
      case 'remove_bg':
        nanoBananaPrompt = 'Remove the background from this product image, make it transparent. Keep the product clear and detailed.';
        break;
      case 'enhance':
        nanoBananaPrompt = 'Enhance the quality of this product image. Improve colors, contrast, lighting, and sharpness. Make it professional.';
        break;
      case 'studio_style':
        nanoBananaPrompt = 'Transform this product image to studio style. Add professional white background, studio lighting, and enhance product appearance.';
        break;
    }

    const nanoResponse = await fetch(`${NANO_BANANA_BASE_URL}/image-to-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.NANO_BANANA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: imageUrl,
        prompt: nanoBananaPrompt,
        num_inference_steps: 50,
        guidance_scale: 7.5,
      }),
    });

    if (!nanoResponse.ok) {
      throw new Error(`Nano Banana API error: ${nanoResponse.status}`);
    }

    const nanoData = await nanoResponse.json() as any;
    const improvedImageUrl = nanoData.image_url || nanoData.output;

    if (!improvedImageUrl) {
      throw new Error('No image URL in response');
    }

    console.log('[processProductImprovement] Generated improved image:', improvedImageUrl);

    // ========================
    // 2. Save before/after to mbuy_studio_image
    // ========================
    const beforeRecord = {
      studio_id: studioId,
      product_id: product.id,
      image_type: 'before',
      role: 'product_image',
      url: imageUrl,
      metadata: { mode, created_at: new Date().toISOString() },
    };

    const afterRecord = {
      studio_id: studioId,
      product_id: product.id,
      image_type: 'after',
      role: 'product_image',
      url: improvedImageUrl,
      metadata: { mode, created_at: new Date().toISOString() },
    };

    // Insert both records
    await supabaseRequest(env, 'mbuy_studio_image', 'POST', beforeRecord);
    await supabaseRequest(env, 'mbuy_studio_image', 'POST', afterRecord);

    console.log('[processProductImprovement] Saved before/after images');

    return { success: true, product_id: product.id };

  } catch (error: any) {
    console.error('[processProductImprovement] Error:', error);
    return { success: false, product_id: product.id, error: error.message };
  }
}

// ============================================================================
// Helper: Create Supabase request with service role
// ============================================================================
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

// ============================================================================
// Generate Image
// ============================================================================
export const generateImage = async (c: AuthContext) => {
  try {
    const authUserId = c.get('authUserId') as string;
    const body = await c.req.json();
    const { prompt, width = 1024, height = 1024, provider = 'cloudflare' } = body;

    if (!prompt) {
      return c.json({ ok: false, error: 'Prompt is required' }, 400);
    }

    // Get merchantId from context
    const storeId = c.get('storeId') as string;
    const contextMerchantId = c.get('merchantId') as string;
    const merchantId = contextMerchantId || storeId || null;

    // Create main request record
    const mainRequest = {
      user_id: authUserId,
      store_id: merchantId,
      task_type: 'image',
      status: 'processing',
      provider_task_id: null,
    };

    const mainRes = await supabaseRequest(c.env, 'mbuy_studio', 'POST', mainRequest);
    if (!mainRes.ok) {
      const error = await mainRes.text();
      return c.json({ ok: false, error: 'Failed to create request', detail: error }, 500);
    }
    const mainData = await mainRes.json() as any[];
    const requestId = mainData[0].id;

    let resultUrl: string | null = null;
    let providerTaskId: string | null = null;

    if (provider === 'cloudflare') {
      // Use Cloudflare AI for image generation
      try {
        const aiResponse = await c.env.AI.run(
          '@cf/stabilityai/stable-diffusion-xl-base-1.0' as any,
          { prompt }
        );

        // Upload to Cloudflare Images
        const imageBuffer = aiResponse as ArrayBuffer;
        const uploadRes = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${c.env.CF_IMAGES_ACCOUNT_ID}/images/v1`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${c.env.CF_IMAGES_API_TOKEN}`,
            },
            body: (() => {
              const formData = new FormData();
              formData.append('file', new Blob([imageBuffer], { type: 'image/png' }), 'generated.png');
              return formData;
            })(),
          }
        );

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json() as any;
          resultUrl = `https://imagedelivery.net/${c.env.CF_IMAGES_ACCOUNT_ID}/${uploadData.result.id}/public`;
        }
      } catch (aiError: any) {
        console.error('Cloudflare AI Error:', aiError);
      }
    } else if (provider === 'nanobanana') {
      // Use NanoBanana API
      const nanoBananaRes = await fetch(`${NANO_BANANA_BASE_URL}/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${c.env.NANO_BANANA_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, type: 'image', width, height }),
      });

      if (nanoBananaRes.ok) {
        const nanoBananaData = await nanoBananaRes.json() as any;
        providerTaskId = nanoBananaData.taskId;
      }
    }

    // Create image record
    const imageRecord = {
      request_id: requestId,
      prompt,
      result_url: resultUrl,
      width,
      height,
      format: 'png',
    };

    await supabaseRequest(c.env, 'mbuy_studio_image', 'POST', imageRecord);

    // Update main request status
    const finalStatus = resultUrl ? 'completed' : (providerTaskId ? 'processing' : 'failed');
    await supabaseRequest(
      c.env,
      `mbuy_studio?id=eq.${requestId}`,
      'PATCH',
      { status: finalStatus, provider_task_id: providerTaskId }
    );

    return c.json({
      ok: true,
      data: {
        requestId,
        status: finalStatus,
        resultUrl,
        providerTaskId,
      },
    });
  } catch (error: any) {
    console.error('Generate Image Error:', error);
    return c.json({ ok: false, error: 'Failed to generate image', detail: error.message }, 500);
  }
};

// ============================================================================
// Generate Video
// ============================================================================
export const generateVideo = async (c: AuthContext) => {
  try {
    const authUserId = c.get('authUserId') as string;
    const body = await c.req.json();
    const { prompt, duration = 5 } = body;

    if (!prompt) {
      return c.json({ ok: false, error: 'Prompt is required' }, 400);
    }

    // Get merchantId from context
    const storeId = c.get('storeId') as string;
    const contextMerchantId = c.get('merchantId') as string;
    const merchantId = contextMerchantId || storeId || null;

    // Create main request record
    const mainRequest = {
      user_id: authUserId,
      store_id: merchantId,
      task_type: 'video',
      status: 'processing',
      provider_task_id: null,
    };

    const mainRes = await supabaseRequest(c.env, 'mbuy_studio', 'POST', mainRequest);
    if (!mainRes.ok) {
      const error = await mainRes.text();
      return c.json({ ok: false, error: 'Failed to create request', detail: error }, 500);
    }
    const mainData = await mainRes.json() as any[];
    const requestId = mainData[0].id;

    // Use NanoBanana for video generation (Cloudflare AI doesn't support video gen yet)
    let providerTaskId: string | null = null;

    const nanoBananaRes = await fetch(`${NANO_BANANA_BASE_URL}/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${c.env.NANO_BANANA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, type: 'video', duration }),
    });

    if (nanoBananaRes.ok) {
      const nanoBananaData = await nanoBananaRes.json() as any;
      providerTaskId = nanoBananaData.taskId;
    }

    // Create video record
    const videoRecord = {
      request_id: requestId,
      prompt,
      result_url: null,
      duration_seconds: duration,
      thumbnail_url: null,
      format: 'mp4',
    };

    await supabaseRequest(c.env, 'mbuy_studio_video', 'POST', videoRecord);

    // Update main request
    await supabaseRequest(
      c.env,
      `mbuy_studio?id=eq.${requestId}`,
      'PATCH',
      { provider_task_id: providerTaskId }
    );

    return c.json({
      ok: true,
      data: {
        requestId,
        status: 'processing',
        providerTaskId,
        message: 'Video generation started. Use /status endpoint to check progress.',
      },
    });
  } catch (error: any) {
    console.error('Generate Video Error:', error);
    return c.json({ ok: false, error: 'Failed to generate video', detail: error.message }, 500);
  }
};

// ============================================================================
// Generate 3D Model
// ============================================================================
export const generate3D = async (c: AuthContext) => {
  try {
    const authUserId = c.get('authUserId') as string;
    const body = await c.req.json();
    const { prompt, format = 'glb' } = body;

    if (!prompt) {
      return c.json({ ok: false, error: 'Prompt is required' }, 400);
    }

    // Get merchantId from context
    const storeId = c.get('storeId') as string;
    const contextMerchantId = c.get('merchantId') as string;
    const merchantId = contextMerchantId || storeId || null;

    // Create main request record
    const mainRequest = {
      user_id: authUserId,
      store_id: merchantId,
      task_type: '3d',
      status: 'processing',
      provider_task_id: null,
    };

    const mainRes = await supabaseRequest(c.env, 'mbuy_studio', 'POST', mainRequest);
    if (!mainRes.ok) {
      const error = await mainRes.text();
      return c.json({ ok: false, error: 'Failed to create request', detail: error }, 500);
    }
    const mainData = await mainRes.json() as any[];
    const requestId = mainData[0].id;

    // Use NanoBanana for 3D generation
    let providerTaskId: string | null = null;

    const nanoBananaRes = await fetch(`${NANO_BANANA_BASE_URL}/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${c.env.NANO_BANANA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, type: '3d', format }),
    });

    if (nanoBananaRes.ok) {
      const nanoBananaData = await nanoBananaRes.json() as any;
      providerTaskId = nanoBananaData.taskId;
    }

    // Create 3D record
    const record3D = {
      request_id: requestId,
      prompt,
      result_url: null,
      format,
      preview_image_url: null,
    };

    await supabaseRequest(c.env, 'mbuy_studio_3D', 'POST', record3D);

    // Update main request
    await supabaseRequest(
      c.env,
      `mbuy_studio?id=eq.${requestId}`,
      'PATCH',
      { provider_task_id: providerTaskId }
    );

    return c.json({
      ok: true,
      data: {
        requestId,
        status: 'processing',
        providerTaskId,
        message: '3D model generation started. Use /status endpoint to check progress.',
      },
    });
  } catch (error: any) {
    console.error('Generate 3D Error:', error);
    return c.json({ ok: false, error: 'Failed to generate 3D model', detail: error.message }, 500);
  }
};

// ============================================================================
// Generate Audio/Voice
// ============================================================================
export const generateAudio = async (c: AuthContext) => {
  try {
    const authUserId = c.get('authUserId') as string;
    const body = await c.req.json();
    const { text, voice = 'default' } = body;

    if (!text) {
      return c.json({ ok: false, error: 'Text is required' }, 400);
    }

    // Get merchantId from context
    const storeId = c.get('storeId') as string;
    const contextMerchantId = c.get('merchantId') as string;
    const merchantId = contextMerchantId || storeId || null;

    // Create main request record
    const mainRequest = {
      user_id: authUserId,
      store_id: merchantId,
      task_type: 'voice',
      status: 'processing',
      provider_task_id: null,
    };

    const mainRes = await supabaseRequest(c.env, 'mbuy_studio', 'POST', mainRequest);
    if (!mainRes.ok) {
      const error = await mainRes.text();
      return c.json({ ok: false, error: 'Failed to create request', detail: error }, 500);
    }
    const mainData = await mainRes.json() as any[];
    const requestId = mainData[0].id;

    let resultUrl: string | null = null;

    // Use Cloudflare AI for TTS
    try {
      const ttsResponse = await c.env.AI.run(
        '@cf/microsoft/speecht5-tts' as any,
        { text }
      );

      // Upload audio to R2
      const audioBuffer = ttsResponse as ArrayBuffer;
      const audioKey = `audio/${requestId}.mp3`;
      
      await c.env.R2?.put(audioKey, audioBuffer, {
        httpMetadata: { contentType: 'audio/mpeg' },
      });

      resultUrl = `${c.env.R2_PUBLIC_URL}/${audioKey}`;
    } catch (aiError: any) {
      console.error('Cloudflare TTS Error:', aiError);
    }

    // Update main request status
    const finalStatus = resultUrl ? 'completed' : 'failed';
    await supabaseRequest(
      c.env,
      `mbuy_studio?id=eq.${requestId}`,
      'PATCH',
      { status: finalStatus }
    );

    return c.json({
      ok: true,
      data: {
        requestId,
        status: finalStatus,
        resultUrl,
      },
    });
  } catch (error: any) {
    console.error('Generate Audio Error:', error);
    return c.json({ ok: false, error: 'Failed to generate audio', detail: error.message }, 500);
  }
};

// ============================================================================
// Check Generation Status
// ============================================================================
export const getGenerationStatus = async (c: AuthContext) => {
  try {
    const authUserId = c.get('authUserId') as string;
    const requestId = c.req.param('requestId');

    if (!requestId) {
      return c.json({ ok: false, error: 'Request ID is required' }, 400);
    }

    // Get main request
    const mainRes = await supabaseRequest(
      c.env,
      `mbuy_studio?id=eq.${requestId}&user_id=eq.${authUserId}&select=*`
    );
    const mainData = await mainRes.json() as any[];

    if (!mainData || mainData.length === 0) {
      return c.json({ ok: false, error: 'Request not found' }, 404);
    }

    const request = mainData[0];

    // If still processing and has provider task ID, check with NanoBanana
    if (request.status === 'processing' && request.provider_task_id) {
      const taskRes = await fetch(
        `${NANO_BANANA_BASE_URL}/task?taskId=${request.provider_task_id}`,
        {
          headers: {
            'Authorization': `Bearer ${c.env.NANO_BANANA_API_KEY}`,
          },
        }
      );

      if (taskRes.ok) {
        const taskData = await taskRes.json() as any;

        if (taskData.status === 'completed' && taskData.result) {
          // Update the result in database
          const resultUrl = taskData.result.url || taskData.result[0]?.url;

          if (request.task_type === 'image') {
            await supabaseRequest(
              c.env,
              `mbuy_studio_image?request_id=eq.${requestId}`,
              'PATCH',
              { result_url: resultUrl }
            );
          } else if (request.task_type === 'video') {
            await supabaseRequest(
              c.env,
              `mbuy_studio_video?request_id=eq.${requestId}`,
              'PATCH',
              { result_url: resultUrl, thumbnail_url: taskData.result.thumbnail }
            );
          } else if (request.task_type === '3d') {
            await supabaseRequest(
              c.env,
              `mbuy_studio_3D?request_id=eq.${requestId}`,
              'PATCH',
              { result_url: resultUrl, preview_image_url: taskData.result.preview }
            );
          }

          // Update main request status
          await supabaseRequest(
            c.env,
            `mbuy_studio?id=eq.${requestId}`,
            'PATCH',
            { status: 'completed' }
          );

          request.status = 'completed';
        } else if (taskData.status === 'failed') {
          await supabaseRequest(
            c.env,
            `mbuy_studio?id=eq.${requestId}`,
            'PATCH',
            { status: 'failed' }
          );
          request.status = 'failed';
        }
      }
    }

    // Get result based on task type
    let result = null;
    if (request.task_type === 'image') {
      const res = await supabaseRequest(c.env, `mbuy_studio_image?request_id=eq.${requestId}&select=*`);
      const data = await res.json() as any[];
      result = data[0];
    } else if (request.task_type === 'video') {
      const res = await supabaseRequest(c.env, `mbuy_studio_video?request_id=eq.${requestId}&select=*`);
      const data = await res.json() as any[];
      result = data[0];
    } else if (request.task_type === '3d') {
      const res = await supabaseRequest(c.env, `mbuy_studio_3D?request_id=eq.${requestId}&select=*`);
      const data = await res.json() as any[];
      result = data[0];
    }

    return c.json({
      ok: true,
      data: {
        ...request,
        result,
      },
    });
  } catch (error: any) {
    console.error('Get Status Error:', error);
    return c.json({ ok: false, error: 'Failed to get status', detail: error.message }, 500);
  }
};

// ============================================================================
// Get User's Generation History
// ============================================================================
export const getGenerationHistory = async (c: AuthContext) => {
  try {
    const authUserId = c.get('authUserId') as string;
    const taskType = c.req.query('type'); // Optional filter
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = parseInt(c.req.query('offset') || '0');

    let query = `mbuy_studio?user_id=eq.${authUserId}&order=created_at.desc&limit=${limit}&offset=${offset}`;
    if (taskType) {
      query += `&task_type=eq.${taskType}`;
    }

    const mainRes = await supabaseRequest(c.env, query);
    const requests = await mainRes.json() as any[];

    // Fetch results for each request
    const results = await Promise.all(
      requests.map(async (request: any) => {
        let result = null;
        if (request.task_type === 'image') {
          const res = await supabaseRequest(c.env, `mbuy_studio_image?request_id=eq.${request.id}&select=*`);
          const data = await res.json() as any[];
          result = data[0];
        } else if (request.task_type === 'video') {
          const res = await supabaseRequest(c.env, `mbuy_studio_video?request_id=eq.${request.id}&select=*`);
          const data = await res.json() as any[];
          result = data[0];
        } else if (request.task_type === '3d') {
          const res = await supabaseRequest(c.env, `mbuy_studio_3D?request_id=eq.${request.id}&select=*`);
          const data = await res.json() as any[];
          result = data[0];
        }
        return { ...request, result };
      })
    );

    return c.json({
      ok: true,
      data: results,
    });
  } catch (error: any) {
    console.error('Get History Error:', error);
    return c.json({ ok: false, error: 'Failed to get history', detail: error.message }, 500);
  }
};

// ============================================================================
// Get Available Templates
// ============================================================================
export const getTemplates = async (c: Context<{ Bindings: Env }>) => {
  // Static templates for now - can be moved to database later
  const templates = [
    // Image Templates
    { id: 'img_product_photo', name: 'صورة منتج احترافية', type: 'image', category: 'product', prompt_template: 'Professional product photo of {product}, white background, studio lighting' },
    { id: 'img_lifestyle', name: 'صورة نمط حياة', type: 'image', category: 'lifestyle', prompt_template: 'Lifestyle photo showing {product} in use, natural lighting, modern setting' },
    { id: 'img_banner', name: 'بانر إعلاني', type: 'image', category: 'marketing', prompt_template: 'Marketing banner for {product}, vibrant colors, call to action' },
    
    // Video Templates
    { id: 'vid_promo', name: 'فيديو ترويجي', type: 'video', category: 'promotional', prompt_template: 'Promotional video showcasing {product}, dynamic transitions, upbeat music' },
    { id: 'vid_unboxing', name: 'فيديو فتح صندوق', type: 'video', category: 'unboxing', prompt_template: 'Unboxing video of {product}, close-up shots, satisfying reveal' },
    { id: 'vid_tutorial', name: 'فيديو تعليمي', type: 'video', category: 'tutorial', prompt_template: 'Tutorial video explaining how to use {product}, step by step' },
    
    // 3D Templates
    { id: '3d_product_spin', name: 'عرض 360 درجة', type: '3d', category: 'showcase', prompt_template: '3D model of {product} for 360 degree rotation view' },
    { id: '3d_ar_ready', name: 'نموذج للواقع المعزز', type: '3d', category: 'ar', prompt_template: 'AR-ready 3D model of {product}, optimized for mobile' },
  ];

  const category = c.req.query('category');
  const type = c.req.query('type');

  let filtered = templates;
  if (category) {
    filtered = filtered.filter(t => t.category === category);
  }
  if (type) {
    filtered = filtered.filter(t => t.type === type);
  }

  return c.json({
    ok: true,
    data: filtered,
  });
};

// ============================================================================
// BULK IMPROVE - التحسين الجماعي للمنتجات
// ============================================================================
export const bulkImprove = async (c: AuthContext) => {
  try {
    const authUserId = c.get('authUserId') as string;
    const profileId = c.get('profileId') as string;
    const body = await c.req.json();
    const { store_id, mode } = body;

    // Validate mode
    if (!['remove_bg', 'enhance', 'studio_style'].includes(mode)) {
      return c.json({ ok: false, error: 'Invalid mode', detail: 'mode must be one of: remove_bg, enhance, studio_style' }, 400);
    }

    console.log('[bulkImprove] Starting bulk improvement:', { authUserId, store_id, mode });

    // ========================
    // 1. Verify store ownership using context
    // ========================
    const storeIdFromContext = c.get('storeId') as string;
    const contextMerchantId = c.get('merchantId') as string;
    const userMerchantId = contextMerchantId || storeIdFromContext;

    if (!userMerchantId || userMerchantId !== store_id) {
      return c.json({ ok: false, error: 'Store not found or unauthorized' }, 403);
    }

    // Fetch merchant credits
    const merchantRes = await supabaseRequest(
      c.env,
      `merchants?id=eq.${store_id}&select=id,credits`
    );
    const merchants = await merchantRes.json() as any[];
    if (merchants.length === 0) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    const merchant = merchants[0];
    const costPerBulk = 10; // 10 points per bulk operation

    if (!merchant.credits || merchant.credits < costPerBulk) {
      return c.json({
        ok: false,
        error: 'Insufficient credits',
        detail: `Need ${costPerBulk} points, you have ${merchant.credits || 0}`
      }, 402);
    }

    // ========================
    // 2. Create main studio record
    // ========================
    const studioRecord = {
      user_id: authUserId,
      store_id: store_id,
      task_type: 'bulk_improve',
      status: 'processing',
      metadata: {
        mode: mode,
        created_at: new Date().toISOString(),
      },
    };

    const studioRes = await supabaseRequest(c.env, 'mbuy_studio', 'POST', studioRecord);
    if (!studioRes.ok) {
      return c.json({ ok: false, error: 'Failed to create studio record' }, 500);
    }

    const studioData = await studioRes.json() as any[];
    const studioId = studioData[0].id;

    console.log('[bulkImprove] Studio record created:', studioId);

    // ========================
    // 3. Deduct points
    // ========================
    await supabaseRequest(
      c.env,
      `merchants?id=eq.${store_id}`,
      'PATCH',
      { credits: merchant.credits - costPerBulk }
    );

    // ========================
    // 4. Fetch all products for this store
    // ========================
    const productsRes = await supabaseRequest(
      c.env,
      `products?merchant_id=eq.${store_id}&select=id,name,main_image_url`
    );
    const products = await productsRes.json() as any[];

    console.log('[bulkImprove] Found products:', products.length);

    // ========================
    // 5. Process each product asynchronously (non-blocking)
    // ========================
    // Note: Since we're on Free Plan, we can't use Cloudflare Queues.
    // Instead, we process async and store status in database.
    
    // Start async processing without waiting
    (async () => {
      for (const product of products) {
        if (!product.main_image_url) {
          console.log('[bulkImprove] Skipping product without image:', product.id);
          continue;
        }

        try {
          await processProductImprovement(
            c.env,
            studioId,
            product,
            mode,
            store_id
          );
        } catch (error: any) {
          console.error('[bulkImprove] Error processing product', product.id, error);
          // Continue with next product
        }
      }

      // Update studio status to completed
      await supabaseRequest(
        c.env,
        `mbuy_studio?id=eq.${studioId}`,
        'PATCH',
        { status: 'completed' }
      );

      console.log('[bulkImprove] All products processed');
    })().catch(err => console.error('[bulkImprove] Background processing error:', err));

    return c.json({
      ok: true,
      status: 'processing',
      message: `Processing ${products.length} products with mode: ${mode}`,
      data: {
        studio_id: studioId,
        product_count: products.length,
        mode: mode,
      },
      cost: costPerBulk,
    }, 202);

  } catch (error: any) {
    console.error('[bulkImprove] Error:', error);
    return c.json({ ok: false, error: 'Failed to start bulk improvement', detail: error.message }, 500);
  }
};

// ============================================================================
// BULK APPLY - تطبيق التحسينات على المتجر
// ============================================================================
export const bulkApply = async (c: AuthContext) => {
  try {
    const authUserId = c.get('authUserId') as string;
    const body = await c.req.json();
    const { studio_id, apply_to = 'store' } = body;

    console.log('[bulkApply] Applying improvements:', { studio_id, apply_to });

    // ========================
    // 1. Fetch studio record and verify ownership
    // ========================
    const studioRes = await supabaseRequest(
      c.env,
      `mbuy_studio?id=eq.${studio_id}&user_id=eq.${authUserId}&select=id,store_id,status`
    );
    const studios = await studioRes.json() as any[];
    if (studios.length === 0) {
      return c.json({ ok: false, error: 'Studio record not found or unauthorized' }, 403);
    }

    const studio = studios[0];
    if (studio.status !== 'completed') {
      return c.json({ ok: false, error: 'Processing not completed yet', detail: `Current status: ${studio.status}` }, 400);
    }

    // ========================
    // 2. Fetch all improved images
    // ========================
    const imagesRes = await supabaseRequest(
      c.env,
      `mbuy_studio_image?studio_id=eq.${studio_id}&role=eq.product_image&select=id,product_id,image_type,url`
    );
    const images = await imagesRes.json() as any[];

    console.log('[bulkApply] Found improved images:', images.length);

    // ========================
    // 3. Update products with improved images
    // ========================
    const updatedProducts = new Set<string>();

    for (const imgRecord of images) {
      if (imgRecord.image_type === 'after') { // Only use the "after" images
        const productId = imgRecord.product_id;
        const improvedUrl = imgRecord.url;

        // Update product's main_image_url
        await supabaseRequest(
          c.env,
          `products?id=eq.${productId}`,
          'PATCH',
          { main_image_url: improvedUrl }
        );

        updatedProducts.add(productId);
        console.log('[bulkApply] Updated product:', productId);
      }
    }

    // ========================
    // 4. Mark studio as applied
    // ========================
    await supabaseRequest(
      c.env,
      `mbuy_studio?id=eq.${studio_id}`,
      'PATCH',
      { status: 'applied' }
    );

    return c.json({
      ok: true,
      message: `Applied improvements to ${updatedProducts.size} products`,
      data: {
        studio_id: studio_id,
        products_updated: updatedProducts.size,
        applied_at: new Date().toISOString(),
      },
    }, 200);

  } catch (error: any) {
    console.error('[bulkApply] Error:', error);
    return c.json({ ok: false, error: 'Failed to apply improvements', detail: error.message }, 500);
  }
};


