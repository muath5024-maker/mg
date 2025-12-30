/**
 * AI Routes Module
 * AI generation and MBUY Studio routes
 */

import { Hono } from 'hono';
import { Env, SupabaseAuthContext } from '../types';
import { supabaseAuthMiddleware } from '../middleware/supabaseAuthMiddleware';
import { nanoBananaGenerate, nanoBananaTaskInfo, personalAssistant } from '../endpoints/ai';
import { cloudflareAiGenerate } from '../endpoints/cloudflareAi';
import { 
  generateImage, 
  generateVideo, 
  generate3D, 
  generateAudio, 
  getGenerationStatus, 
  getGenerationHistory, 
  getTemplates, 
  bulkImprove, 
  bulkApply 
} from '../endpoints/mbuyStudio';
import { 
  createAiJob, 
  generateText, 
  generateProductDescription, 
  generateKeywords, 
  generateImageJob, 
  generateBanner, 
  generateLogo, 
  generateAudioJob, 
  generateVideoJob, 
  getAiLibrary, 
  getJobDetail 
} from '../endpoints/aiJobs';

type Variables = SupabaseAuthContext;

const aiRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// ========================================
// Public AI Test (no auth)
// ========================================

aiRoutes.get('/test', async (c) => {
  try {
    console.log('[ai/test] Testing AI binding...');
    const result = await c.env.AI.run('@cf/meta/llama-3-8b-instruct' as any, {
      messages: [{ role: 'user', content: 'Say hello in Arabic' }],
      max_tokens: 50,
    });
    console.log('[ai/test] AI result:', result);
    return c.json({ ok: true, result });
  } catch (error: any) {
    console.error('[ai/test] AI error:', error.message);
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// Apply auth middleware to protected routes
aiRoutes.use('/generate/*', supabaseAuthMiddleware);
aiRoutes.use('/studio/*', supabaseAuthMiddleware);
aiRoutes.use('/jobs/*', supabaseAuthMiddleware);

// ========================================
// AI Generation (NanoBanana & Cloudflare)
// ========================================

aiRoutes.post('/generate', nanoBananaGenerate);
aiRoutes.get('/generate/:taskId', nanoBananaTaskInfo);
aiRoutes.post('/generate/cloudflare', cloudflareAiGenerate);

// ========================================
// MBUY Studio
// ========================================

aiRoutes.post('/studio/image', generateImage);
aiRoutes.post('/studio/video', generateVideo);
aiRoutes.post('/studio/3d', generate3D);
aiRoutes.post('/studio/audio', generateAudio);
aiRoutes.get('/studio/status/:id', getGenerationStatus);
aiRoutes.get('/studio/history', getGenerationHistory);
aiRoutes.get('/studio/templates', getTemplates);
aiRoutes.post('/studio/bulk-improve', bulkImprove);
aiRoutes.post('/studio/bulk-apply', bulkApply);

// ========================================
// AI Jobs
// ========================================

aiRoutes.post('/jobs', createAiJob);
aiRoutes.get('/jobs', getAiLibrary);
aiRoutes.get('/jobs/:id', getJobDetail);
aiRoutes.post('/jobs/text', generateText);
aiRoutes.post('/jobs/description', generateProductDescription);
aiRoutes.post('/jobs/keywords', generateKeywords);
aiRoutes.post('/jobs/image', generateImageJob);
aiRoutes.post('/jobs/banner', generateBanner);
aiRoutes.post('/jobs/logo', generateLogo);
aiRoutes.post('/jobs/audio', generateAudioJob);
aiRoutes.post('/jobs/video', generateVideoJob);

// ========================================
// Personal Assistant (Public - no auth)
// ========================================

aiRoutes.post('/assistant', personalAssistant);

export default aiRoutes;
