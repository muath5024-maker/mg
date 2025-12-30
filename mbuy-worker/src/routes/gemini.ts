/**
 * Gemini AI Routes Module
 * Google Gemini API integration routes
 */

import { Hono } from 'hono';
import { Env, SupabaseAuthContext } from '../types';

type Variables = SupabaseAuthContext;

const geminiRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// ========================================
// Gemini Text Generation
// ========================================

// Gemini Chat - Text generation
geminiRoutes.post('/chat', async (c) => {
  try {
    const { messages, model } = await c.req.json();
    const geminiModel = model || 'gemini-1.5-flash';
    const userId = c.get('authUserId') as string;

    // Convert messages to Gemini format
    const contents = messages.map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : msg.role,
      parts: [{ text: msg.content }]
    }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${c.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents })
      }
    );

    const data = await response.json() as any;

    if (!response.ok) {
      return c.json({ error: 'Gemini API error', detail: data }, response.status as any);
    }

    return c.json({
      ok: true,
      response: data.candidates[0].content.parts[0].text,
      model: geminiModel,
      userId
    });
  } catch (error: any) {
    return c.json({ error: 'Gemini chat failed', detail: error.message }, 500);
  }
});

// Gemini Generate - Simple text generation
geminiRoutes.post('/generate', async (c) => {
  try {
    const { prompt, model } = await c.req.json();
    const geminiModel = model || 'gemini-1.5-flash';
    const userId = c.get('authUserId') as string;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${c.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json() as any;

    if (!response.ok) {
      return c.json({ error: 'Gemini API error', detail: data }, response.status as any);
    }

    return c.json({
      ok: true,
      text: data.candidates[0].content.parts[0].text,
      model: geminiModel,
      userId
    });
  } catch (error: any) {
    return c.json({ error: 'Gemini generation failed', detail: error.message }, 500);
  }
});

// ========================================
// Gemini Vision
// ========================================

// Gemini Vision - Image analysis
geminiRoutes.post('/vision', async (c) => {
  try {
    const { imageBase64, prompt, model } = await c.req.json();
    const geminiModel = model || 'gemini-1.5-flash';
    const userId = c.get('authUserId') as string;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${c.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt || 'Describe this image in detail' },
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: imageBase64
                }
              }
            ]
          }]
        })
      }
    );

    const data = await response.json() as any;

    if (!response.ok) {
      return c.json({ error: 'Gemini Vision error', detail: data }, response.status as any);
    }

    return c.json({
      ok: true,
      analysis: data.candidates[0].content.parts[0].text,
      model: geminiModel,
      userId
    });
  } catch (error: any) {
    return c.json({ error: 'Gemini vision analysis failed', detail: error.message }, 500);
  }
});

// ========================================
// Product-specific Gemini features
// ========================================

// Analyze product image
geminiRoutes.post('/analyze-product', async (c) => {
  try {
    const { imageBase64, productName } = await c.req.json();
    const userId = c.get('authUserId') as string;

    const prompt = productName
      ? `Analyze this product image for "${productName}". Provide: 1) Product description 2) Key features 3) Suggested categories 4) SEO keywords. Respond in Arabic.`
      : 'Analyze this product image. Provide: 1) Product description 2) Key features 3) Suggested categories 4) SEO keywords. Respond in Arabic.';

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${c.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: imageBase64
                }
              }
            ]
          }]
        })
      }
    );

    const data = await response.json() as any;

    if (!response.ok) {
      return c.json({ error: 'Product analysis failed', detail: data }, response.status as any);
    }

    return c.json({
      ok: true,
      analysis: data.candidates[0].content.parts[0].text,
      userId
    });
  } catch (error: any) {
    return c.json({ error: 'Product analysis failed', detail: error.message }, 500);
  }
});

// Generate product description
geminiRoutes.post('/product-description', async (c) => {
  try {
    const { productName, category, features, tone } = await c.req.json();
    const userId = c.get('authUserId') as string;

    const prompt = `اكتب وصفًا احترافيًا لمنتج "${productName}" في فئة "${category || 'عام'}".
المميزات: ${features || 'غير محدد'}
النبرة: ${tone || 'احترافية'}
اجعل الوصف جذابًا ومقنعًا للعملاء.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${c.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json() as any;

    if (!response.ok) {
      return c.json({ error: 'Description generation failed', detail: data }, response.status as any);
    }

    return c.json({
      ok: true,
      description: data.candidates[0].content.parts[0].text,
      userId
    });
  } catch (error: any) {
    return c.json({ error: 'Description generation failed', detail: error.message }, 500);
  }
});

export default geminiRoutes;
