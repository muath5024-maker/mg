/**
 * Studio Routes - API endpoints للاستوديو
 */

import { Hono } from 'hono';
import { createOpenRouterService } from '../services/openrouter.service';
import { createFalService } from '../services/fal.service';
import { createElevenLabsService } from '../services/elevenlabs.service';
import { createDIDService } from '../services/did.service';
import { createRenderService } from '../services/render.service';
import type {
  GenerateScriptRequest,
  GenerateImageRequest,
  GenerateVoiceRequest,
  GenerateUGCRequest,
  CreateProjectRequest,
  StartRenderRequest,
  StudioErrorCodes,
} from '../types/studio.types';

// Types for environment bindings
interface Env {
  OPENROUTER_API_KEY: string;
  FAL_AI_API_KEY: string;
  ELEVENLABS_API_KEY: string;
  DID_API_KEY: string;
  REPLICATE_API_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  R2_BUCKET: R2Bucket;
}

interface Variables {
  userId: string;
  storeId: string;
}

const studio = new Hono<{ Bindings: Env; Variables: Variables }>();

// =====================================================
// Middleware - التحقق من الرصيد
// =====================================================

async function checkCredits(
  supabaseUrl: string,
  supabaseKey: string,
  userId: string,
  requiredCredits: number
): Promise<{ hasEnough: boolean; balance: number }> {
  const response = await fetch(`${supabaseUrl}/rest/v1/user_credits?user_id=eq.${userId}`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
    },
  });

  if (!response.ok) {
    return { hasEnough: false, balance: 0 };
  }

  const data = await response.json();
  const balance = data[0]?.balance || 0;

  return {
    hasEnough: balance >= requiredCredits,
    balance,
  };
}

async function deductCredits(
  supabaseUrl: string,
  supabaseKey: string,
  userId: string,
  amount: number
): Promise<boolean> {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/deduct_credits`, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      p_user_id: userId,
      p_amount: amount,
    }),
  });

  return response.ok;
}

// =====================================================
// Credits Endpoints
// =====================================================

// الحصول على رصيد المستخدم
studio.get('/credits', async (c) => {
  const userId = c.get('userId');
  
  const response = await fetch(
    `${c.env.SUPABASE_URL}/rest/v1/user_credits?user_id=eq.${userId}`,
    {
      headers: {
        'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  );

  if (!response.ok) {
    return c.json({ error: 'Failed to fetch credits' }, 500);
  }

  const data = await response.json() as Array<{balance: number; total_earned: number; total_spent: number}>;
  
  if (data.length === 0) {
    // إنشاء رصيد للمستخدم الجديد
    await fetch(`${c.env.SUPABASE_URL}/rest/v1/user_credits`, {
      method: 'POST',
      headers: {
        'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        user_id: userId,
        balance: 100,
        total_earned: 100,
      }),
    });

    return c.json({ balance: 100, total_earned: 100, total_spent: 0 });
  }

  return c.json({
    balance: data[0].balance,
    total_earned: data[0].total_earned,
    total_spent: data[0].total_spent,
  });
});

// =====================================================
// Templates Endpoints
// =====================================================

// الحصول على القوالب المتاحة
studio.get('/templates', async (c) => {
  const category = c.req.query('category');
  
  let url = `${c.env.SUPABASE_URL}/rest/v1/studio_templates?is_active=eq.true&order=usage_count.desc`;
  
  if (category) {
    url += `&category=eq.${category}`;
  }

  const response = await fetch(url, {
    headers: {
      'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });

  const templates = await response.json();
  return c.json({ templates });
});

// الحصول على قالب محدد
studio.get('/templates/:id', async (c) => {
  const id = c.req.param('id');
  
  const response = await fetch(
    `${c.env.SUPABASE_URL}/rest/v1/studio_templates?id=eq.${id}`,
    {
      headers: {
        'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  );

  const data = await response.json() as Array<Record<string, unknown>>;
  
  if (data.length === 0) {
    return c.json({ error: 'Template not found' }, 404);
  }

  return c.json({ template: data[0] });
});

// =====================================================
// Projects Endpoints
// =====================================================

// إنشاء مشروع جديد
studio.post('/projects', async (c) => {
  const userId = c.get('userId');
  const storeId = c.get('storeId');
  const body = await c.req.json<CreateProjectRequest>();

  const response = await fetch(`${c.env.SUPABASE_URL}/rest/v1/studio_projects`, {
    method: 'POST',
    headers: {
      'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({
      user_id: userId,
      store_id: storeId,
      name: body.name,
      template_id: body.template_id,
      product_id: body.product_id,
      product_data: body.product_data || {},
      status: 'draft',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    return c.json({ error: 'Failed to create project', details: error }, 500);
  }

  const data = await response.json();
  return c.json({ success: true, project: data[0] }, 201);
});

// الحصول على مشاريع المستخدم
studio.get('/projects', async (c) => {
  const userId = c.get('userId');
  const status = c.req.query('status');
  
  let url = `${c.env.SUPABASE_URL}/rest/v1/studio_projects?user_id=eq.${userId}&order=updated_at.desc`;
  
  if (status) {
    url += `&status=eq.${status}`;
  }

  const response = await fetch(url, {
    headers: {
      'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });

  const projects = await response.json();
  return c.json({ projects });
});

// الحصول على مشروع محدد مع المشاهد
studio.get('/projects/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');

  // جلب المشروع
  const projectRes = await fetch(
    `${c.env.SUPABASE_URL}/rest/v1/studio_projects?id=eq.${id}&user_id=eq.${userId}`,
    {
      headers: {
        'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  );

  const projectData = await projectRes.json() as Array<Record<string, unknown>>;
  
  if (projectData.length === 0) {
    return c.json({ error: 'Project not found' }, 404);
  }

  // جلب المشاهد
  const scenesRes = await fetch(
    `${c.env.SUPABASE_URL}/rest/v1/studio_scenes?project_id=eq.${id}&order=order_index.asc`,
    {
      headers: {
        'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  );

  const scenes = await scenesRes.json();

  return c.json({
    project: projectData[0],
    scenes,
  });
});

// تحديث مشروع
studio.patch('/projects/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const body = await c.req.json();

  const response = await fetch(
    `${c.env.SUPABASE_URL}/rest/v1/studio_projects?id=eq.${id}&user_id=eq.${userId}`,
    {
      method: 'PATCH',
      headers: {
        'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        ...body,
        updated_at: new Date().toISOString(),
      }),
    }
  );

  if (!response.ok) {
    return c.json({ error: 'Failed to update project' }, 500);
  }

  const data = await response.json();
  return c.json({ success: true, project: data[0] });
});

// حذف مشروع
studio.delete('/projects/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');

  const response = await fetch(
    `${c.env.SUPABASE_URL}/rest/v1/studio_projects?id=eq.${id}&user_id=eq.${userId}`,
    {
      method: 'DELETE',
      headers: {
        'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  );

  if (!response.ok) {
    return c.json({ error: 'Failed to delete project' }, 500);
  }

  return c.json({ success: true });
});

// =====================================================
// AI Generation Endpoints
// =====================================================

// توليد سيناريو
studio.post('/generate/script', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json<GenerateScriptRequest>();

  // التحقق من الرصيد
  const creditCheck = await checkCredits(
    c.env.SUPABASE_URL,
    c.env.SUPABASE_SERVICE_ROLE_KEY,
    userId,
    5
  );

  if (!creditCheck.hasEnough) {
    return c.json({
      error: 'Insufficient credits',
      code: 'INSUFFICIENT_CREDITS',
      required: 5,
      balance: creditCheck.balance,
    }, 402);
  }

  try {
    const openrouter = createOpenRouterService(c.env.OPENROUTER_API_KEY);
    
    const result = await openrouter.generateAdScript(body.product_data, {
      language: body.language || 'ar',
      tone: body.tone,
      durationSeconds: body.duration_seconds,
    });

    // خصم الرصيد
    const creditsUsed = openrouter.calculateCredits(result.tokensUsed);
    await deductCredits(
      c.env.SUPABASE_URL,
      c.env.SUPABASE_SERVICE_ROLE_KEY,
      userId,
      creditsUsed
    );

    return c.json({
      success: true,
      script: result.script,
      credits_used: creditsUsed,
    });
  } catch (error: any) {
    console.error('Script generation error:', error);
    return c.json({
      error: 'Script generation failed',
      details: error.message,
    }, 500);
  }
});

// توليد صورة
studio.post('/generate/image', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json<GenerateImageRequest>();

  const creditCheck = await checkCredits(
    c.env.SUPABASE_URL,
    c.env.SUPABASE_SERVICE_ROLE_KEY,
    userId,
    2
  );

  if (!creditCheck.hasEnough) {
    return c.json({
      error: 'Insufficient credits',
      code: 'INSUFFICIENT_CREDITS',
    }, 402);
  }

  try {
    const fal = createFalService(c.env.FAL_AI_API_KEY);
    
    const result = await fal.generateImage({
      prompt: body.prompt,
      aspectRatio: body.aspect_ratio,
      style: body.style,
    });

    // خصم الرصيد
    await deductCredits(
      c.env.SUPABASE_URL,
      c.env.SUPABASE_SERVICE_ROLE_KEY,
      userId,
      result.creditsUsed
    );

    // حفظ الأصل في قاعدة البيانات
    if (body.project_id && result.images.length > 0) {
      await fetch(`${c.env.SUPABASE_URL}/rest/v1/studio_assets`, {
        method: 'POST',
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          project_id: body.project_id,
          asset_type: 'image',
          source: 'ai_generated',
          url: result.images[0].url,
          width: result.images[0].width,
          height: result.images[0].height,
          ai_prompt: body.prompt,
          ai_model: result.model,
          ai_cost_credits: result.creditsUsed,
        }),
      });
    }

    return c.json({
      success: true,
      image_url: result.images[0]?.url,
      images: result.images,
      credits_used: result.creditsUsed,
    });
  } catch (error: any) {
    console.error('Image generation error:', error);
    return c.json({
      error: 'Image generation failed',
      details: error.message,
    }, 500);
  }
});

// توليد صوت
studio.post('/generate/voice', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json<GenerateVoiceRequest>();

  const estimatedCredits = Math.ceil(body.text.length / 1000);
  
  const creditCheck = await checkCredits(
    c.env.SUPABASE_URL,
    c.env.SUPABASE_SERVICE_ROLE_KEY,
    userId,
    estimatedCredits
  );

  if (!creditCheck.hasEnough) {
    return c.json({
      error: 'Insufficient credits',
      code: 'INSUFFICIENT_CREDITS',
    }, 402);
  }

  try {
    const elevenlabs = createElevenLabsService(c.env.ELEVENLABS_API_KEY);
    
    const result = await elevenlabs.generateVoice({
      text: body.text,
      voiceId: body.voice_id,
      language: body.language,
    });

    // خصم الرصيد
    await deductCredits(
      c.env.SUPABASE_URL,
      c.env.SUPABASE_SERVICE_ROLE_KEY,
      userId,
      result.creditsUsed
    );

    // رفع الملف الصوتي لـ R2
    const audioKey = `audio/${userId}/${Date.now()}.mp3`;
    await c.env.R2_BUCKET.put(audioKey, result.audioBuffer, {
      httpMetadata: { contentType: 'audio/mpeg' },
    });

    const audioUrl = `https://r2.mbuy.app/${audioKey}`;

    // حفظ في قاعدة البيانات
    if (body.project_id) {
      await fetch(`${c.env.SUPABASE_URL}/rest/v1/studio_assets`, {
        method: 'POST',
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          project_id: body.project_id,
          asset_type: 'audio',
          source: 'ai_generated',
          url: audioUrl,
          duration_ms: result.durationMs,
          ai_cost_credits: result.creditsUsed,
        }),
      });
    }

    return c.json({
      success: true,
      audio_url: audioUrl,
      duration_ms: result.durationMs,
      credits_used: result.creditsUsed,
    });
  } catch (error: any) {
    console.error('Voice generation error:', error);
    return c.json({
      error: 'Voice generation failed',
      details: error.message,
    }, 500);
  }
});

// توليد فيديو UGC
studio.post('/generate/ugc', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json<GenerateUGCRequest>();

  const did = createDIDService(c.env.DID_API_KEY);
  const estimatedCredits = did.calculateCredits(body.script);

  const creditCheck = await checkCredits(
    c.env.SUPABASE_URL,
    c.env.SUPABASE_SERVICE_ROLE_KEY,
    userId,
    estimatedCredits
  );

  if (!creditCheck.hasEnough) {
    return c.json({
      error: 'Insufficient credits',
      code: 'INSUFFICIENT_CREDITS',
    }, 402);
  }

  try {
    // إنشاء الطلب (لا ننتظر الاكتمال)
    const result = await did.createTalk({
      script: body.script,
      avatarId: body.avatar_id,
      voiceId: body.voice_id,
    });

    // خصم الرصيد
    await deductCredits(
      c.env.SUPABASE_URL,
      c.env.SUPABASE_SERVICE_ROLE_KEY,
      userId,
      result.creditsUsed
    );

    return c.json({
      success: true,
      talk_id: result.talkId,
      status: result.status,
      credits_used: result.creditsUsed,
      message: 'UGC video is being generated. Use GET /generate/ugc/:talkId to check status.',
    });
  } catch (error: any) {
    console.error('UGC generation error:', error);
    return c.json({
      error: 'UGC generation failed',
      details: error.message,
    }, 500);
  }
});

// التحقق من حالة فيديو UGC
studio.get('/generate/ugc/:talkId', async (c) => {
  const talkId = c.req.param('talkId');

  try {
    const did = createDIDService(c.env.DID_API_KEY);
    const status = await did.getTalkStatus(talkId);

    return c.json({
      talk_id: talkId,
      status: status.status,
      result_url: status.result_url,
      thumbnail_url: status.thumbnail_url,
      duration: status.duration,
      error: status.error,
    });
  } catch (error: any) {
    return c.json({
      error: 'Failed to get UGC status',
      details: error.message,
    }, 500);
  }
});

// =====================================================
// Scenes Endpoints
// =====================================================

// إضافة/تحديث مشاهد
studio.post('/projects/:projectId/scenes', async (c) => {
  const userId = c.get('userId');
  const projectId = c.req.param('projectId');
  const body = await c.req.json();

  // التحقق من ملكية المشروع
  const projectRes = await fetch(
    `${c.env.SUPABASE_URL}/rest/v1/studio_projects?id=eq.${projectId}&user_id=eq.${userId}`,
    {
      headers: {
        'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  );

  const projectData = await projectRes.json() as Array<Record<string, unknown>>;
  if (projectData.length === 0) {
    return c.json({ error: 'Project not found' }, 404);
  }

  // إضافة المشاهد
  const scenes = Array.isArray(body) ? body : [body];
  const scenesWithProject = scenes.map((scene: any, index: number) => ({
    ...scene,
    project_id: projectId,
    order_index: scene.order_index ?? index,
  }));

  const response = await fetch(`${c.env.SUPABASE_URL}/rest/v1/studio_scenes`, {
    method: 'POST',
    headers: {
      'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(scenesWithProject),
  });

  if (!response.ok) {
    const error = await response.text();
    return c.json({ error: 'Failed to create scenes', details: error }, 500);
  }

  const data = await response.json();
  return c.json({ success: true, scenes: data }, 201);
});

// تحديث مشهد
studio.patch('/scenes/:id', async (c) => {
  const userId = c.get('userId');
  const sceneId = c.req.param('id');
  const body = await c.req.json();

  // جلب المشهد والتحقق من الملكية
  const sceneRes = await fetch(
    `${c.env.SUPABASE_URL}/rest/v1/studio_scenes?id=eq.${sceneId}&select=*,studio_projects!inner(user_id)`,
    {
      headers: {
        'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  );

  const sceneData = await sceneRes.json() as Array<{studio_projects?: {user_id: string}}>;
  if (sceneData.length === 0 || sceneData[0].studio_projects?.user_id !== userId) {
    return c.json({ error: 'Scene not found' }, 404);
  }

  const response = await fetch(
    `${c.env.SUPABASE_URL}/rest/v1/studio_scenes?id=eq.${sceneId}`,
    {
      method: 'PATCH',
      headers: {
        'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    return c.json({ error: 'Failed to update scene' }, 500);
  }

  const data = await response.json();
  return c.json({ success: true, scene: data[0] });
});

// =====================================================
// Render Endpoints
// =====================================================

// بدء الرندر
studio.post('/render', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json<StartRenderRequest>();

  // جلب المشروع والمشاهد
  const projectRes = await fetch(
    `${c.env.SUPABASE_URL}/rest/v1/studio_projects?id=eq.${body.project_id}&user_id=eq.${userId}`,
    {
      headers: {
        'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  );

  const projectData = await projectRes.json() as Array<Record<string, unknown>>;
  if (projectData.length === 0) {
    return c.json({ error: 'Project not found' }, 404);
  }

  const scenesRes = await fetch(
    `${c.env.SUPABASE_URL}/rest/v1/studio_scenes?project_id=eq.${body.project_id}&order=order_index.asc`,
    {
      headers: {
        'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  );

  const scenes = await scenesRes.json() as Array<Record<string, unknown>>;

  if (scenes.length === 0) {
    return c.json({ error: 'No scenes to render' }, 400);
  }

  // حساب التكلفة
  const renderService = createRenderService();
  const creditsRequired = renderService.calculateRenderCredits({
    project: projectData[0] as any,
    scenes: scenes as any,
    quality: body.quality || 'medium',
    format: body.format || 'mp4',
    includeAudio: true,
    includeWatermark: false,
  });

  const creditCheck = await checkCredits(
    c.env.SUPABASE_URL,
    c.env.SUPABASE_SERVICE_ROLE_KEY,
    userId,
    creditsRequired
  );

  if (!creditCheck.hasEnough) {
    return c.json({
      error: 'Insufficient credits',
      code: 'INSUFFICIENT_CREDITS',
      required: creditsRequired,
      balance: creditCheck.balance,
    }, 402);
  }

  // إنشاء سجل الرندر
  const renderRes = await fetch(`${c.env.SUPABASE_URL}/rest/v1/studio_renders`, {
    method: 'POST',
    headers: {
      'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({
      project_id: body.project_id,
      user_id: userId,
      status: 'queued',
      resolution: body.resolution || '1080p',
      quality: body.quality || 'medium',
      format: body.format || 'mp4',
      credits_cost: creditsRequired,
    }),
  });

  const renderData = await renderRes.json() as Array<{id: string; project_id: string}>;

  // إنشاء manifest للـ Flutter
  const manifest = renderService.generateRenderManifest({
    project: projectData[0] as any,
    scenes: scenes as any,
    quality: body.quality || 'medium',
    format: body.format || 'mp4',
    includeAudio: true,
    includeWatermark: !!(projectData[0] as any).settings?.logo_url,
  });

  // تحديث حالة المشروع
  await fetch(
    `${c.env.SUPABASE_URL}/rest/v1/studio_projects?id=eq.${body.project_id}`,
    {
      method: 'PATCH',
      headers: {
        'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'processing' }),
    }
  );

  // خصم الرصيد
  await deductCredits(
    c.env.SUPABASE_URL,
    c.env.SUPABASE_SERVICE_ROLE_KEY,
    userId,
    creditsRequired
  );

  return c.json({
    success: true,
    render_id: renderData[0].id,
    manifest,
    estimated_time_seconds: renderService.estimateRenderTime({
      project: projectData[0] as any,
      scenes: scenes as any,
      quality: body.quality || 'medium',
      format: body.format || 'mp4',
      includeAudio: true,
      includeWatermark: false,
    }),
    credits_cost: creditsRequired,
  });
});

// تحديث حالة الرندر (من Flutter بعد الاكتمال)
studio.patch('/render/:id/complete', async (c) => {
  const userId = c.get('userId');
  const renderId = c.req.param('id');
  const body = await c.req.json<{
    status: 'completed' | 'failed';
    output_url?: string;
    output_size_bytes?: number;
    error_message?: string;
  }>();

  // تحديث سجل الرندر
  const response = await fetch(
    `${c.env.SUPABASE_URL}/rest/v1/studio_renders?id=eq.${renderId}&user_id=eq.${userId}`,
    {
      method: 'PATCH',
      headers: {
        'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        status: body.status,
        output_url: body.output_url,
        output_size_bytes: body.output_size_bytes,
        error_message: body.error_message,
        completed_at: new Date().toISOString(),
      }),
    }
  );

  const renderData = await response.json() as Array<{id: string; project_id: string}>;
  
  if (renderData.length > 0 && body.status === 'completed' && body.output_url) {
    // تحديث المشروع
    await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/studio_projects?id=eq.${renderData[0].project_id}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'ready',
          output_url: body.output_url,
          output_size_bytes: body.output_size_bytes,
        }),
      }
    );
  }

  return c.json({ success: true });
});

// =====================================================
// Voices & Avatars Endpoints
// =====================================================

// الحصول على الأصوات المتاحة
studio.get('/voices', async (c) => {
  try {
    const elevenlabs = createElevenLabsService(c.env.ELEVENLABS_API_KEY);
    const voices = await elevenlabs.getVoices();
    const recommended = elevenlabs.getRecommendedArabicVoices();

    return c.json({
      voices: voices.slice(0, 20), // أول 20 صوت
      recommended,
    });
  } catch (error: any) {
    return c.json({
      voices: [],
      recommended: [],
      error: error.message,
    });
  }
});

// الحصول على الأفاتارات المتاحة
studio.get('/avatars', async (c) => {
  const did = createDIDService(c.env.DID_API_KEY);
  const recommended = did.getRecommendedAvatars();

  return c.json({
    avatars: recommended,
  });
});

export default studio;
