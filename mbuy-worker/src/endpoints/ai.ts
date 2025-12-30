import { Context } from 'hono';
import { Env } from '../types';

// ============= NanoBanana via OpenRouter (with Cloudflare AI Fallback) =============

// توليد صورة باستخدام Cloudflare Workers AI (البديل المجاني)
async function generateWithCloudflareAI(c: Context<{ Bindings: Env }>, prompt: string): Promise<Response> {
  console.log('[Cloudflare AI] Fallback - Generating image for:', prompt.substring(0, 50));
  
  try {
    const IMAGE_MODEL = '@cf/stabilityai/stable-diffusion-xl-base-1.0';
    const finalPrompt = `${prompt}, professional product photography, studio lighting, white background, 8k, sharp focus, commercial photo`;
    
    const imageBytes = await c.env.AI.run(IMAGE_MODEL as any, { prompt: finalPrompt });
    
    // رفع الصورة إلى R2
    const imageId = `cloudflare_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const key = `ai/images/${imageId}.png`;
    
    if (c.env.R2) {
      await c.env.R2.put(key, imageBytes as ArrayBuffer, {
        httpMetadata: { contentType: 'image/png' },
      });
      
      const imageUrl = `${c.env.R2_PUBLIC_URL}/${key}`;
      console.log('[Cloudflare AI] Image uploaded:', imageUrl);
      
      return c.json({
        status: 'completed',
        image_url: imageUrl,
        provider: 'cloudflare',
      });
    }
    
    // إذا لم يكن R2 متاحاً، أرجع الصورة كـ base64
    const base64 = btoa(String.fromCharCode(...new Uint8Array(imageBytes as ArrayBuffer)));
    return c.json({
      status: 'completed',
      image_base64: `data:image/png;base64,${base64}`,
      provider: 'cloudflare',
    });
  } catch (error) {
    console.error('[Cloudflare AI] Error:', error);
    return c.json({ error: 'Cloudflare AI generation failed', details: String(error) }, 500);
  }
}

// توليد صورة باستخدام NanoBanana عبر OpenRouter
export const nanoBananaGenerate = async (c: Context<{ Bindings: Env }>) => {
  let promptValue: string = '';
  
  try {
    const body = await c.req.json();
    promptValue = body.prompt;
    
    if (!promptValue) {
      return c.json({ error: 'Prompt is required' }, 400);
    }

    // استخدام OPENROUTER_API_KEY
    const apiKey = (c.env as any).OPENROUTER_API_KEY;

    if (!apiKey) {
      // إذا لم يكن OpenRouter متاحاً، استخدم Cloudflare AI مباشرة
      console.log('[NanoBanana] No OpenRouter API key, using Cloudflare AI fallback');
      return generateWithCloudflareAI(c, promptValue);
    }

    console.log('[NanoBanana] Generating image for:', promptValue.substring(0, 50));

    // استدعاء OpenRouter API لتوليد الصور باستخدام Gemini 2.5 Flash Image (NanoBanana)
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://mbuy.app',
        'X-Title': 'MBuy AI Studio',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image',  // NanoBanana - نموذج توليد الصور
        messages: [
          {
            role: 'user',
            content: `Generate an image: ${promptValue}`
          }
        ],
        modalities: ['image', 'text'],  // مهم! لطلب صورة
        max_tokens: 1024,  // تقليل عدد التوكن لتجنب خطأ نقص الرصيد
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[NanoBanana/OpenRouter] API Error:', response.status, errorText);
      
      // إذا كان الخطأ بسبب نقص الرصيد (402) أو أي خطأ آخر، استخدم Cloudflare AI كبديل
      if (response.status === 402 || response.status === 429 || response.status >= 500) {
        console.log('[NanoBanana] OpenRouter failed, using Cloudflare AI fallback');
        return generateWithCloudflareAI(c, promptValue);
      }
      
      return c.json({ 
        error: 'OpenRouter API error', 
        status: response.status,
        details: errorText 
      }, response.status as any);
    }

    const data: any = await response.json();
    console.log('[NanoBanana/OpenRouter] Response received');

    // التحقق من وجود الصور في الاستجابة (الطريقة الجديدة من OpenRouter)
    const message = data?.choices?.[0]?.message;
    const images = message?.images;
    
    if (images && images.length > 0) {
      // الصور تكون في message.images
      const imageData = images[0];
      const imageUrl = imageData?.image_url?.url;
      
      if (imageUrl && imageUrl.startsWith('data:image')) {
        // استخراج base64 من data URL
        const base64Match = imageUrl.match(/data:image\/(png|jpeg|jpg|gif|webp);base64,(.+)/);
        
        if (base64Match) {
          const mimeType = `image/${base64Match[1]}`;
          const base64Data = base64Match[2];
          
          // تحويل base64 إلى ArrayBuffer
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          
          // رفع إلى R2
          const imageId = `nanobanana_${Date.now()}_${Math.random().toString(36).substring(7)}`;
          const ext = base64Match[1];
          const key = `ai/images/${imageId}.${ext}`;
          
          if (c.env.R2) {
            await c.env.R2.put(key, bytes.buffer, {
              httpMetadata: { contentType: mimeType },
            });
            
            const uploadedUrl = `${c.env.R2_PUBLIC_URL}/${key}`;
            console.log('[NanoBanana] Image uploaded to R2:', uploadedUrl);
            
            return c.json({
              status: 'completed',
              image_url: uploadedUrl,
              provider: 'nanobanana',
            });
          }
        }
      }
    }

    // استخراج الصورة من الاستجابة (طريقة قديمة - fallback)
    const content = message?.content;
    
    // التحقق إذا كانت الاستجابة تحتوي على صورة base64
    if (typeof content === 'string') {
      // البحث عن base64 image في النص
      const base64Match = content.match(/data:image\/(png|jpeg|jpg|gif|webp);base64,([A-Za-z0-9+/=]+)/);
      
      if (base64Match) {
        const mimeType = `image/${base64Match[1]}`;
        const base64Data = base64Match[2];
        
        // تحويل base64 إلى ArrayBuffer
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        // رفع إلى R2
        const imageId = `openrouter_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const ext = base64Match[1];
        const key = `ai/images/${imageId}.${ext}`;
        
        if (c.env.R2) {
          await c.env.R2.put(key, bytes.buffer, {
            httpMetadata: { contentType: mimeType },
          });
          
          const imageUrl = `${c.env.R2_PUBLIC_URL}/${key}`;
          console.log('[NanoBanana/OpenRouter] Image uploaded:', imageUrl);
          
          return c.json({
            status: 'completed',
            image_url: imageUrl,
            provider: 'openrouter',
          });
        }
      }
      
      // إذا كانت الاستجابة نص (وصف أو رابط)
      // التحقق من وجود رابط صورة
      const urlMatch = content.match(/https?:\/\/[^\s]+\.(png|jpg|jpeg|gif|webp)/i);
      if (urlMatch) {
        return c.json({
          status: 'completed',
          image_url: urlMatch[0],
          provider: 'openrouter',
        });
      }

      return c.json({
        status: 'completed',
        text: content,
        provider: 'openrouter',
        message: 'النموذج أرجع نصاً بدلاً من صورة. جرب نموذج آخر.',
      });
    }

    // التحقق من الاستجابة كـ array (multimodal)
    if (Array.isArray(content)) {
      for (const part of content) {
        if (part.type === 'image_url' && part.image_url?.url) {
          return c.json({
            status: 'completed',
            image_url: part.image_url.url,
            provider: 'openrouter',
          });
        }
      }
    }

    return c.json({
      status: 'completed',
      text: JSON.stringify(content),
      provider: 'openrouter',
      raw: data,
    });

  } catch (error) {
    console.error('[NanoBanana/OpenRouter] Exception:', error);
    
    // في حالة حدوث أي خطأ، جرب Cloudflare AI كبديل
    if (promptValue) {
      console.log('[NanoBanana] Exception occurred, trying Cloudflare AI fallback');
      try {
        return await generateWithCloudflareAI(c, promptValue);
      } catch (fallbackError) {
        console.error('[Cloudflare AI Fallback] Also failed:', fallbackError);
      }
    }
    
    return c.json({ error: 'Image generation failed', details: String(error) }, 500);
  }
};

// التحقق من حالة المهمة (للتوافق)
export const nanoBananaTaskInfo = async (c: Context<{ Bindings: Env }>) => {
  const taskId = c.req.query('taskId');

  if (!taskId) {
    return c.json({ error: 'taskId is required' }, 400);
  }

  return c.json({
    status: 'completed',
    message: 'Direct generation - no task tracking needed',
  });
};

// معرفة الخدمات المتاحة
export const getAvailableProviders = async (c: Context<{ Bindings: Env }>) => {
  const providers = [];
  
  if (c.env.NANO_BANANA_API_KEY) {
    providers.push({ 
      id: 'nanobanana', 
      name: 'NanoBanana', 
      description: 'توليد صور بالذكاء الاصطناعي عبر OpenRouter',
      available: true
    });
  }

  return c.json({ providers });
};

// ============= المساعد الشخصي (Personal Assistant) =============

// المساعد الشخصي باستخدام Cloudflare Workers AI (مجاني)
export const personalAssistant = async (c: Context<{ Bindings: Env }>) => {
  try {
    const { message, context, history } = await c.req.json();

    if (!message) {
      return c.json({ error: 'Message is required' }, 400);
    }

    console.log('[PersonalAssistant] Processing:', message.substring(0, 50));

    // بناء الرسائل مع السياق والتاريخ
    const messages: any[] = [
      {
        role: 'system',
        content: `أنت مساعد ذكي لتطبيق MBuy - منصة التجارة الإلكترونية للتجار.
        
مهامك:
- مساعدة التجار في إدارة متاجرهم
- الإجابة على الأسئلة المتعلقة بالمنتجات والطلبات والعملاء
- تقديم نصائح لتحسين المبيعات
- المساعدة في كتابة أوصاف المنتجات
- شرح ميزات التطبيق

أسلوبك:
- ودود ومحترف
- موجز ومفيد
- استخدم العربية الفصحى السهلة
- قدم إجابات عملية وقابلة للتطبيق

${context ? `سياق إضافي: ${context}` : ''}`
      }
    ];

    // إضافة تاريخ المحادثة إن وجد
    if (history && Array.isArray(history)) {
      for (const msg of history.slice(-10)) { // آخر 10 رسائل فقط
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      }
    }

    // إضافة الرسالة الحالية
    messages.push({
      role: 'user',
      content: message
    });

    // استخدام Cloudflare Workers AI (مجاني 10,000 طلب/يوم)
    const result = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct' as any, {
      messages: messages,
      max_tokens: 1024,
      temperature: 0.7,
    });

    const reply = (result as any)?.response;

    if (!reply) {
      console.error('[PersonalAssistant] No response from AI:', result);
      return c.json({ 
        error: 'No response from assistant',
        raw: result 
      }, 500);
    }

    console.log('[PersonalAssistant] Response generated');

    return c.json({
      success: true,
      reply: reply,
      model: 'llama-3.1-8b',
      provider: 'cloudflare'
    });

  } catch (error) {
    console.error('[PersonalAssistant] Exception:', error);
    return c.json({ error: 'Assistant failed', details: String(error) }, 500);
  }
};


