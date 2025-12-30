import { Context } from 'hono';
import { Env, SupabaseAuthContext } from '../types';

type AuthContext = Context<{ Bindings: Env; Variables: SupabaseAuthContext }>;

type Method = 'GET' | 'POST' | 'PATCH';

const TEXT_MODEL = '@cf/meta/llama-3-8b-instruct';
const IMAGE_MODEL = '@cf/stabilityai/stable-diffusion-xl-base-1.0';

const BANNER_PRESETS: Record<string, { width: number; height: number }> = {
  square: { width: 1080, height: 1080 },
  story: { width: 1080, height: 1920 },
  landscape: { width: 1200, height: 628 },
};

async function adminRequest(
  env: Env,
  table: string,
  method: Method,
  body?: any,
  query?: Record<string, string | number | null>
) {
  const url = new URL(`${env.SUPABASE_URL}/rest/v1/${table}`);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, `eq.${value}`);
      }
    });
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
  };
  if (method === 'POST' || method === 'PATCH') {
    headers.Prefer = 'return=representation';
  }

  const response = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase error ${response.status}: ${text}`);
  }

  if (method === 'GET') {
    return response.json();
  }

  const data = await response.json();
  return Array.isArray(data) ? data[0] : data;
}

async function createJob(env: Env, userId: string, jobType: string, prompt: string | null, merchantId?: string | null, params?: any, status: string = 'queued') {
  return adminRequest(env, 'ai_jobs', 'POST', {
    user_id: userId,
    job_type: jobType,
    prompt,
    store_id: merchantId ?? null,
    status,
    params: params ?? {}, // Use empty object instead of null
  });
}

async function updateJobStatus(env: Env, jobId: string, status: string, errorMessage?: string | null) {
  return adminRequest(env, 'ai_jobs', 'PATCH', { status, error: errorMessage ?? null }, { id: jobId });
}

async function logPrompt(env: Env, jobId: string, userId: string, rawPrompt: string, finalPrompt: string, model: string, metadata?: any) {
  return adminRequest(env, 'ai_prompts', 'POST', {
    job_id: jobId,
    user_id: userId,
    raw_prompt: rawPrompt,
    final_prompt: finalPrompt,
    model,
    metadata: metadata ?? null,
  });
}

async function uploadToR2(env: Env, key: string, data: ArrayBuffer, contentType: string) {
  if (!env.R2) throw new Error('R2 binding missing');
  await env.R2.put(key, data, {
    httpMetadata: { contentType },
  });
  return `${env.R2_PUBLIC_URL}/${key}`;
}

function normalizeTextResult(result: any): string {
  if (!result) return '';
  if (typeof result === 'string') return result;
  if (result.response) return result.response;
  if (result.output) return result.output;
  if (result.result) return result.result;
  return JSON.stringify(result);
}

// A) Create Job
export const createAiJob = async (c: AuthContext) => {
  try {
    const userId = c.get('authUserId') as string;
    const body = await c.req.json();
    const { job_type, prompt = null, store_id = null, params = null } = body;

    if (!job_type) return c.json({ error: 'job_type is required' }, 400);

    const job = await createJob(c.env, userId, job_type, prompt, store_id, params, 'queued');
    return c.json({ job_id: job.id });
  } catch (error: any) {
    console.error('[AI Jobs] create job error', error);
    return c.json({ error: 'Failed to create job', detail: error.message }, 500);
  }
};

// B) Generic text generation
export const generateText = async (c: AuthContext) => {
  const userId = c.get('authUserId') as string;
  const body = await c.req.json();
  const { prompt, store_id = null, params = null } = body;

  if (!prompt || prompt.length < 4) {
    return c.json({ error: 'prompt is required' }, 400);
  }

  const job = await createJob(c.env, userId, 'prompt', prompt, store_id, params, 'processing');
  try {
    const finalPrompt = `${prompt}

يرجى الإجابة بشكل مباشر ومختصر باللغة العربية.`;

    const result = await c.env.AI.run(TEXT_MODEL as any, {
      messages: [
        { role: 'system', content: 'أنت مساعد ذكي. أجب دائماً باللغة العربية بشكل مباشر ومفيد. لا تكرر السؤال.' },
        { role: 'user', content: finalPrompt }
      ],
      max_tokens: params?.max_tokens ?? 1024,
    });
    const text = normalizeTextResult(result);

    await logPrompt(c.env, job.id, userId, prompt, finalPrompt, TEXT_MODEL);
    await updateJobStatus(c.env, job.id, 'completed');
    return c.json({ job_id: job.id, text });
  } catch (error: any) {
    await updateJobStatus(c.env, job.id, 'failed', error.message);
    return c.json({ error: 'Text generation failed', detail: error.message, job_id: job.id }, 500);
  }
};

// C) Product description
export const generateProductDescription = async (c: AuthContext) => {
  const userId = c.get('authUserId') as string;
  const body = await c.req.json();
  const { prompt, product_id = null, language = 'ar', tone = 'friendly', store_id = null, params = null } = body;

  if (!prompt) return c.json({ error: 'prompt is required' }, 400);

  const job = await createJob(c.env, userId, 'product_description', prompt, store_id, params, 'processing');
  try {
    const toneMap: Record<string, string> = {
      friendly: 'ودية',
      professional: 'احترافية',
      casual: 'بسيطة',
      luxury: 'فاخرة',
    };
    const toneAr = toneMap[tone] || 'ودية';
    
    const finalPrompt = `اكتب وصفاً تسويقياً قصيراً ومقنعاً للمنتج: "${prompt}"
بنبرة ${toneAr}.
اكتب 2-3 جمل فقط تبرز مميزات المنتج.`;

    const result = await c.env.AI.run(TEXT_MODEL as any, {
      messages: [
        { role: 'system', content: 'أنت كاتب محتوى تسويقي. اكتب أوصاف منتجات قصيرة وجذابة بالعربية.' },
        { role: 'user', content: finalPrompt }
      ],
      max_tokens: params?.max_tokens ?? 300,
    });
    const content = normalizeTextResult(result);

    await logPrompt(c.env, job.id, userId, prompt, finalPrompt, TEXT_MODEL, { language, tone, product_id });
    await updateJobStatus(c.env, job.id, 'completed');
    return c.json({ job_id: job.id, content, description: content });
  } catch (error: any) {
    await updateJobStatus(c.env, job.id, 'failed', error.message);
    return c.json({ error: 'Product description failed', detail: error.message, job_id: job.id }, 500);
  }
};

// D) Keywords
export const generateKeywords = async (c: AuthContext) => {
  const userId = c.get('authUserId') as string;
  const body = await c.req.json();
  const { prompt, product_id = null, language = 'ar', store_id = null, params = null } = body;

  if (!prompt) return c.json({ error: 'prompt is required' }, 400);

  const job = await createJob(c.env, userId, 'keywords', prompt, store_id, params, 'processing');
  try {
    const finalPrompt = `اقترح 8 كلمات مفتاحية للبحث عن: "${prompt}"
اكتب كل كلمة في سطر منفصل بدون أرقام.`;

    const result = await c.env.AI.run(TEXT_MODEL as any, {
      messages: [
        { role: 'system', content: 'اقترح كلمات مفتاحية بالعربية. كل كلمة في سطر.' },
        { role: 'user', content: finalPrompt }
      ],
      max_tokens: params?.max_tokens ?? 200,
    });
    const text = normalizeTextResult(result);
    const keywords = text
      .split(/\n|،|,/)
      .map((k) => k.trim().replace(/^[\d\-\.\)\*]+\s*/, '').replace(/^\-\s*/, ''))
      .filter((k) => k.length > 1 && k.length < 40);

    await logPrompt(c.env, job.id, userId, prompt, finalPrompt, TEXT_MODEL, { language, product_id });
    await updateJobStatus(c.env, job.id, 'completed');
    return c.json({ job_id: job.id, keywords });
  } catch (error: any) {
    await updateJobStatus(c.env, job.id, 'failed', error.message);
    return c.json({ error: 'Keyword generation failed', detail: error.message, job_id: job.id }, 500);
  }
};

// E) Image
export const generateImageJob = async (c: AuthContext) => {
  const userId = c.get('authUserId') as string;
  console.log('[generateImageJob] Starting for user:', userId);
  
  const body = await c.req.json();
  const { prompt, style = 'realistic', size = '1024x1024', store_id = null, params = null } = body;
  console.log('[generateImageJob] Prompt:', prompt?.substring(0, 50), 'Style:', style);

  if (!prompt) return c.json({ error: 'prompt is required' }, 400);

  const [width, height] = size.split('x').map((v: string) => parseInt(v, 10));
  
  let job: any;
  try {
    job = await createJob(c.env, userId, 'image', prompt, store_id, params, 'processing');
    console.log('[generateImageJob] Job created:', job?.id);
  } catch (jobError: any) {
    console.error('[generateImageJob] Failed to create job:', jobError.message);
    return c.json({ error: 'Failed to create job', detail: jobError.message }, 500);
  }
  
  try {
    // بناء prompt إنجليزي واضح لنموذج الصور
    const stylePrompts: Record<string, string> = {
      realistic: 'professional product photography, studio lighting, white background, 8k, sharp focus, commercial photo',
      clean: 'clean minimal product shot, simple white background, soft lighting, professional, high quality',
      artistic: 'artistic product image, creative lighting, aesthetic, beautiful composition, high quality',
      minimal: 'minimalist product photo, simple clean design, white space, elegant, modern',
    };
    
    const styleAddition = stylePrompts[style] || stylePrompts.realistic;
    // تحويل الوصف العربي إلى صيغة إنجليزية مناسبة للصور
    const finalPrompt = `${prompt}, ${styleAddition}`;
    console.log('[generateImageJob] Final prompt:', finalPrompt);
    
    const imageBytes = await c.env.AI.run(IMAGE_MODEL as any, { prompt: finalPrompt });
    console.log('[generateImageJob] AI completed, uploading to R2...');
    
    const key = `ai/${userId}/${job.id}/image.png`;
    const imageUrl = await uploadToR2(c.env, key, imageBytes as ArrayBuffer, 'image/png');
    console.log('[generateImageJob] Uploaded to R2:', imageUrl);

    await logPrompt(c.env, job.id, userId, prompt, finalPrompt, IMAGE_MODEL, { width, height, style });
    await updateJobStatus(c.env, job.id, 'completed');
    console.log('[generateImageJob] Success!');
    return c.json({ job_id: job.id, image_url: imageUrl });
  } catch (error: any) {
    console.error('[generateImageJob] Error:', error.message, error.stack);
    if (job?.id) {
      await updateJobStatus(c.env, job.id, 'failed', error.message);
    }
    return c.json({ error: 'Image generation failed', detail: error.message, job_id: job?.id }, 500);
  }
};

// F) Banner
export const generateBanner = async (c: AuthContext) => {
  const userId = c.get('authUserId') as string;
  const body = await c.req.json();
  const { prompt, placement = 'instagram', sizePreset = 'square', store_id = null, params = null } = body;

  if (!prompt) return c.json({ error: 'prompt is required' }, 400);

  const preset = BANNER_PRESETS[sizePreset] || BANNER_PRESETS.square;
  const job = await createJob(c.env, userId, 'banner', prompt, store_id, params, 'processing');
  try {
    // بناء prompt مخصص للبانرات الإعلانية
    const finalPrompt = `E-commerce promotional banner design, "${prompt}", modern clean layout, bold typography space, vibrant gradient colors, professional marketing material, high quality digital design, no text`;
    console.log('[generateBanner] Final prompt:', finalPrompt);
    
    const imageBytes = await c.env.AI.run(IMAGE_MODEL as any, { prompt: finalPrompt });
    const key = `ai/${userId}/${job.id}/banner.png`;
    const bannerUrl = await uploadToR2(c.env, key, imageBytes as ArrayBuffer, 'image/png');

    await logPrompt(c.env, job.id, userId, prompt, finalPrompt, IMAGE_MODEL, { placement, sizePreset });
    await updateJobStatus(c.env, job.id, 'completed');
    return c.json({ job_id: job.id, banner_url: bannerUrl });
  } catch (error: any) {
    await updateJobStatus(c.env, job.id, 'failed', error.message);
    return c.json({ error: 'Banner generation failed', detail: error.message, job_id: job.id }, 500);
  }
};

// G) Logo
export const generateLogo = async (c: AuthContext) => {
  const userId = c.get('authUserId') as string;
  const body = await c.req.json();
  const { brand_name, style = 'modern', colors = null, prompt = '', store_id = null, params = null } = body;

  if (!brand_name) return c.json({ error: 'brand_name is required' }, 400);

  const job = await createJob(c.env, userId, 'logo', prompt || brand_name, store_id, params, 'processing');
  try {
    // بناء prompt مخصص للشعارات
    const styleMap: Record<string, string> = {
      modern: 'modern minimalist',
      classic: 'classic elegant',
      minimal: 'ultra minimal simple',
      bold: 'bold geometric',
    };
    const styleDesc = styleMap[style] || 'modern minimalist';
    const colorDesc = colors ? `, ${colors} color scheme` : ', blue and white colors';
    
    const logoPrompt = `${styleDesc} logo design, brand "${brand_name}", icon symbol, clean vector style${colorDesc}, centered on pure white background, professional business logo, simple shapes, no text, high quality`;
    console.log('[generateLogo] Final prompt:', logoPrompt);
    
    const bytes = await c.env.AI.run(IMAGE_MODEL as any, { prompt: logoPrompt });
    const key = `ai/${userId}/${job.id}/logo.png`;
    const url = await uploadToR2(c.env, key, bytes as ArrayBuffer, 'image/png');

    await logPrompt(c.env, job.id, userId, prompt || brand_name, logoPrompt, IMAGE_MODEL, { style, colors });
    await updateJobStatus(c.env, job.id, 'completed');
    return c.json({ job_id: job.id, logo_url: url, options: [url] });
  } catch (error: any) {
    await updateJobStatus(c.env, job.id, 'failed', error.message);
    return c.json({ error: 'Logo generation failed', detail: error.message, job_id: job.id }, 500);
  }
};

// H) Audio (TTS) - stubbed if provider missing
export const generateAudioJob = async (c: AuthContext) => {
  const userId = c.get('authUserId') as string;
  const body = await c.req.json();
  const { text, voice_type = 'default', language = 'ar', store_id = null, params = null } = body;

  if (!text) return c.json({ error: 'text is required' }, 400);

  const job = await createJob(c.env, userId, 'audio', text, store_id, params, 'processing');
  try {
    return c.json({ error: 'Provider missing', detail: 'Audio provider not configured', job_id: job.id }, 501);
  } finally {
    await updateJobStatus(c.env, job.id, 'failed', 'Audio provider not configured');
    // Skip saving to ai_audios - table may not exist
  }
};

// I) Video - stub with failure
export const generateVideoJob = async (c: AuthContext) => {
  const userId = c.get('authUserId') as string;
  const body = await c.req.json();
  const { prompt, duration = 5, aspect = '1:1', store_id = null, params = null } = body;

  if (!prompt) return c.json({ error: 'prompt is required' }, 400);

  try {
    const job = await createJob(c.env, userId, 'video', prompt, store_id, params, 'processing');
    await updateJobStatus(c.env, job.id, 'failed', 'Video provider not configured');
    return c.json({
      job_id: job.id,
      status: 'failed',
      message: 'Video provider not configured yet',
    });
  } catch (error: any) {
    // Even on unexpected errors, return a graceful 200 with failed status
    return c.json({
      job_id: null,
      status: 'failed',
      message: 'Video provider not configured yet',
      detail: error?.message,
    });
  }
};

// J) Library
export const getAiLibrary = async (c: AuthContext) => {
  const userId = c.get('authUserId') as string;
  const type = c.req.query('type') || 'all';
  const tables: Record<string, string[]> = {
    image: ['ai_images'],
    banner: ['ai_banners'],
    video: ['ai_videos'],
    audio: ['ai_audios'],
    logo: ['ai_logos'],
    product_description: ['ai_product_descriptions'],
    keywords: ['ai_keywords'],
    all: ['ai_images', 'ai_banners', 'ai_videos', 'ai_audios', 'ai_logos', 'ai_product_descriptions', 'ai_keywords'],
  };

  const selectedTables = tables[type] || tables.all;
  const results: any[] = [];

  for (const table of selectedTables) {
    try {
      const rows = await adminRequest(c.env, table, 'GET', undefined, { user_id: userId });
      rows.forEach((row: any) => results.push({ ...row, source: table }));
    } catch (err) {
      console.warn('[AI Library] skip table', table, err);
    }
  }

  results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return c.json({ data: results });
};

// K) Job detail
export const getJobDetail = async (c: AuthContext) => {
  const userId = c.get('authUserId') as string;
  const jobId = c.req.param('id');
  if (!jobId) return c.json({ error: 'job id required' }, 400);

  try {
    const jobRows = await adminRequest(c.env, 'ai_jobs', 'GET', undefined, { id: jobId, user_id: userId });
    if (!jobRows || jobRows.length === 0) return c.json({ error: 'not found' }, 404);
    const job = jobRows[0];

    let result = null;
    switch (job.job_type) {
      case 'image':
        result = (await adminRequest(c.env, 'ai_images', 'GET', undefined, { job_id: jobId }))[0] ?? null;
        break;
      case 'banner':
        result = (await adminRequest(c.env, 'ai_banners', 'GET', undefined, { job_id: jobId }))[0] ?? null;
        break;
      case 'video':
        result = (await adminRequest(c.env, 'ai_videos', 'GET', undefined, { job_id: jobId }))[0] ?? null;
        break;
      case 'audio':
        result = (await adminRequest(c.env, 'ai_audios', 'GET', undefined, { job_id: jobId }))[0] ?? null;
        break;
      case 'logo':
        result = await adminRequest(c.env, 'ai_logos', 'GET', undefined, { job_id: jobId });
        break;
      case 'product_description':
        result = (await adminRequest(c.env, 'ai_product_descriptions', 'GET', undefined, { job_id: jobId }))[0] ?? null;
        break;
      case 'keywords':
        result = (await adminRequest(c.env, 'ai_keywords', 'GET', undefined, { job_id: jobId }))[0] ?? null;
        break;
      default:
        break;
    }

    return c.json({ job, result });
  } catch (error: any) {
    console.error('[AI Jobs] detail error', error);
    return c.json({ error: 'Failed to fetch job', detail: error.message }, 500);
  }
};

// L) AI Favorites - إضافة للمفضلة
export const addToFavorites = async (c: AuthContext) => {
  const userId = c.get('authUserId') as string;
  const body = await c.req.json();
  const { type, url, content, prompt, metadata = {} } = body;

  if (!type) return c.json({ error: 'type is required' }, 400);
  if (!url && !content) return c.json({ error: 'url or content is required' }, 400);

  try {
    const favorite = await adminRequest(c.env, 'ai_favorites', 'POST', {
      user_id: userId,
      type,
      url: url || null,
      content: content || null,
      prompt: prompt || null,
      metadata,
    });

    return c.json({ ok: true, data: favorite });
  } catch (error: any) {
    console.error('[AI Favorites] add error', error);
    return c.json({ error: 'Failed to add favorite', detail: error.message }, 500);
  }
};

// M) Get Favorites - الحصول على المفضلة
export const getFavorites = async (c: AuthContext) => {
  const userId = c.get('authUserId') as string;
  const type = c.req.query('type');

  try {
    const query: Record<string, string> = { user_id: userId };
    if (type) query.type = type;

    const url = new URL(`${c.env.SUPABASE_URL}/rest/v1/ai_favorites`);
    url.searchParams.append('user_id', `eq.${userId}`);
    if (type) url.searchParams.append('type', `eq.${type}`);
    url.searchParams.append('order', 'created_at.desc');
    url.searchParams.append('limit', '50');

    const response = await fetch(url.toString(), {
      headers: {
        'Content-Type': 'application/json',
        apikey: c.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Supabase error: ${response.status}`);
    }

    const data = await response.json();
    return c.json({ ok: true, data });
  } catch (error: any) {
    console.error('[AI Favorites] get error', error);
    return c.json({ error: 'Failed to get favorites', detail: error.message }, 500);
  }
};

// N) Delete Favorite - حذف من المفضلة
export const deleteFavorite = async (c: AuthContext) => {
  const userId = c.get('authUserId') as string;
  const favoriteId = c.req.param('id');

  if (!favoriteId) return c.json({ error: 'favorite id required' }, 400);

  try {
    const url = new URL(`${c.env.SUPABASE_URL}/rest/v1/ai_favorites`);
    url.searchParams.append('id', `eq.${favoriteId}`);
    url.searchParams.append('user_id', `eq.${userId}`);

    const response = await fetch(url.toString(), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        apikey: c.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Supabase error: ${response.status}`);
    }

    return c.json({ ok: true });
  } catch (error: any) {
    console.error('[AI Favorites] delete error', error);
    return c.json({ error: 'Failed to delete favorite', detail: error.message }, 500);
  }
};


