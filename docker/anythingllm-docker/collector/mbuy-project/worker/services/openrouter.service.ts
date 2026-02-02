/**
 * OpenRouter Service - خدمة توليد السيناريوهات
 * يستخدم OpenRouter API للوصول لنماذج مثل GPT-4, Claude
 */

import type {
  OpenRouterRequest,
  OpenRouterResponse,
  ProductData,
  ScriptData,
  GeneratedScene,
  SceneType,
} from '../types/studio.types';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// النماذج المتاحة
export const OPENROUTER_MODELS = {
  GPT4_TURBO: 'openai/gpt-4-turbo',
  GPT4: 'openai/gpt-4',
  GPT35_TURBO: 'openai/gpt-3.5-turbo',
  CLAUDE_3_SONNET: 'anthropic/claude-3-sonnet',
  CLAUDE_3_HAIKU: 'anthropic/claude-3-haiku',
  LLAMA_70B: 'meta-llama/llama-3-70b-instruct',
} as const;

// التكلفة التقريبية لكل 1000 token
const MODEL_COSTS = {
  [OPENROUTER_MODELS.GPT4_TURBO]: 0.01,
  [OPENROUTER_MODELS.GPT4]: 0.03,
  [OPENROUTER_MODELS.GPT35_TURBO]: 0.0005,
  [OPENROUTER_MODELS.CLAUDE_3_SONNET]: 0.003,
  [OPENROUTER_MODELS.CLAUDE_3_HAIKU]: 0.00025,
  [OPENROUTER_MODELS.LLAMA_70B]: 0.0007,
};

export interface OpenRouterServiceConfig {
  apiKey: string;
  defaultModel?: string;
  siteUrl?: string;
  siteName?: string;
}

export class OpenRouterService {
  private apiKey: string;
  private defaultModel: string;
  private siteUrl: string;
  private siteName: string;

  constructor(config: OpenRouterServiceConfig) {
    this.apiKey = config.apiKey;
    this.defaultModel = config.defaultModel || OPENROUTER_MODELS.GPT35_TURBO;
    this.siteUrl = config.siteUrl || 'https://mbuy.app';
    this.siteName = config.siteName || 'MBUY Studio';
  }

  /**
   * إرسال طلب لـ OpenRouter API
   */
  private async makeRequest(request: OpenRouterRequest): Promise<OpenRouterResponse> {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': this.siteUrl,
        'X-Title': this.siteName,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * توليد سيناريو إعلاني للمنتج
   */
  async generateAdScript(
    productData: ProductData,
    options: {
      language?: string;
      tone?: 'professional' | 'casual' | 'energetic' | 'luxury';
      durationSeconds?: number;
      templateType?: string;
    } = {}
  ): Promise<{ script: ScriptData; tokensUsed: number }> {
    const {
      language = 'ar',
      tone = 'professional',
      durationSeconds = 30,
      templateType = 'product_ad',
    } = options;

    const systemPrompt = this.getSystemPrompt(language, tone);
    const userPrompt = this.buildProductPrompt(productData, durationSeconds, templateType, language);

    const request: OpenRouterRequest = {
      model: this.defaultModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 2000,
      temperature: 0.7,
    };

    const response = await this.makeRequest(request);
    const content = response.choices[0]?.message?.content || '';
    
    const script = this.parseScriptResponse(content, language);

    return {
      script,
      tokensUsed: response.usage?.total_tokens || 0,
    };
  }

  /**
   * توليد وصف لصورة المنتج (Prompt لـ Fal.ai)
   */
  async generateImagePrompt(
    productData: ProductData,
    sceneDescription: string,
    style: string = 'professional'
  ): Promise<{ prompt: string; negativePrompt: string; tokensUsed: number }> {
    const request: OpenRouterRequest = {
      model: OPENROUTER_MODELS.GPT35_TURBO,
      messages: [
        {
          role: 'system',
          content: `You are an expert at writing prompts for AI image generation.
Create detailed, vivid prompts that will generate high-quality product images.
Focus on: lighting, composition, background, mood, and professional product photography style.
Always output in English for best results.
Format: Return ONLY a JSON object with "prompt" and "negativePrompt" keys.`,
        },
        {
          role: 'user',
          content: `Product: ${productData.name}
Description: ${productData.description}
Scene: ${sceneDescription}
Style: ${style}

Generate an image prompt for this product shot.`,
        },
      ],
      max_tokens: 500,
      temperature: 0.8,
    };

    const response = await this.makeRequest(request);
    const content = response.choices[0]?.message?.content || '';

    try {
      const parsed = JSON.parse(content);
      return {
        prompt: parsed.prompt || content,
        negativePrompt: parsed.negativePrompt || 'blurry, low quality, distorted, ugly, bad anatomy',
        tokensUsed: response.usage?.total_tokens || 0,
      };
    } catch {
      return {
        prompt: content,
        negativePrompt: 'blurry, low quality, distorted, ugly, bad anatomy',
        tokensUsed: response.usage?.total_tokens || 0,
      };
    }
  }

  /**
   * تحسين النص للتعليق الصوتي
   */
  async enhanceNarration(
    text: string,
    language: string = 'ar'
  ): Promise<{ enhancedText: string; tokensUsed: number }> {
    const request: OpenRouterRequest = {
      model: OPENROUTER_MODELS.GPT35_TURBO,
      messages: [
        {
          role: 'system',
          content: language === 'ar'
            ? `أنت خبير في كتابة النصوص الإعلانية العربية.
قم بتحسين النص ليكون أكثر جاذبية وسلاسة عند النطق.
حافظ على المعنى الأصلي وأضف لمسة إقناعية.
أعد النص المحسن فقط بدون أي شرح.`
            : `You are an expert in writing advertising copy.
Improve the text to be more engaging and smooth when spoken.
Keep the original meaning and add a persuasive touch.
Return only the improved text without any explanation.`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      max_tokens: 500,
      temperature: 0.6,
    };

    const response = await this.makeRequest(request);
    
    return {
      enhancedText: response.choices[0]?.message?.content || text,
      tokensUsed: response.usage?.total_tokens || 0,
    };
  }

  /**
   * الحصول على System Prompt حسب اللغة والأسلوب
   */
  private getSystemPrompt(language: string, tone: string): string {
    const toneDescriptions: Record<string, Record<string, string>> = {
      ar: {
        professional: 'احترافي ورسمي',
        casual: 'ودود وغير رسمي',
        energetic: 'حماسي ومليء بالطاقة',
        luxury: 'فاخر وراقي',
      },
      en: {
        professional: 'professional and formal',
        casual: 'friendly and casual',
        energetic: 'energetic and exciting',
        luxury: 'luxurious and elegant',
      },
    };

    const toneDesc = toneDescriptions[language]?.[tone] || toneDescriptions.ar.professional;

    if (language === 'ar') {
      return `أنت كاتب سيناريوهات إعلانية محترف متخصص في إعلانات السوشيال ميديا.
أسلوبك: ${toneDesc}

مهمتك:
1. كتابة سيناريو إعلاني جذاب ومقنع
2. تقسيم السيناريو إلى مشاهد واضحة
3. كل مشهد يحتوي على: وصف بصري، نص منطوق، ومدة

قواعد مهمة:
- ابدأ بـ "Hook" قوي يجذب الانتباه في أول 3 ثوان
- استخدم لغة بسيطة وواضحة
- ركز على الفوائد وليس المميزات فقط
- اختم بدعوة واضحة للإجراء (CTA)

أعد الرد بصيغة JSON فقط.`;
    }

    return `You are a professional advertising scriptwriter specializing in social media ads.
Your style: ${toneDesc}

Your task:
1. Write an engaging and persuasive ad script
2. Divide the script into clear scenes
3. Each scene contains: visual description, spoken text, and duration

Important rules:
- Start with a strong "Hook" that grabs attention in the first 3 seconds
- Use simple and clear language
- Focus on benefits, not just features
- End with a clear call to action (CTA)

Return the response in JSON format only.`;
  }

  /**
   * بناء Prompt للمنتج
   */
  private buildProductPrompt(
    productData: ProductData,
    durationSeconds: number,
    templateType: string,
    language: string
  ): string {
    const features = productData.features?.join('، ') || '';
    
    if (language === 'ar') {
      return `اكتب سيناريو إعلاني لهذا المنتج:

المنتج: ${productData.name_ar || productData.name}
الوصف: ${productData.description_ar || productData.description}
السعر: ${productData.price} ${productData.currency || 'ر.س'}
المميزات: ${features}

نوع الإعلان: ${templateType}
المدة المطلوبة: ${durationSeconds} ثانية

أعد الرد بالصيغة التالية:
{
  "title": "عنوان الإعلان",
  "hook": "جملة الجذب الأولى",
  "scenes": [
    {
      "index": 1,
      "type": "intro|image|ugc|text|cta",
      "visual_prompt": "وصف المشهد البصري بالإنجليزية للـ AI",
      "narration": "النص المنطوق بالعربية",
      "text_overlay": "النص المعروض على الشاشة",
      "duration_ms": 3000
    }
  ],
  "cta": "نص الدعوة للإجراء"
}`;
    }

    return `Write an advertising script for this product:

Product: ${productData.name}
Description: ${productData.description}
Price: ${productData.price} ${productData.currency || 'SAR'}
Features: ${features}

Ad type: ${templateType}
Required duration: ${durationSeconds} seconds

Return the response in this format:
{
  "title": "Ad title",
  "hook": "Opening hook line",
  "scenes": [
    {
      "index": 1,
      "type": "intro|image|ugc|text|cta",
      "visual_prompt": "Visual description for AI image generation",
      "narration": "Spoken text",
      "text_overlay": "On-screen text",
      "duration_ms": 3000
    }
  ],
  "cta": "Call to action text"
}`;
  }

  /**
   * تحليل رد السيناريو
   */
  private parseScriptResponse(content: string, language: string): ScriptData {
    try {
      // محاولة استخراج JSON من الرد
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          title: parsed.title,
          hook: parsed.hook,
          scenes: (parsed.scenes || []).map((scene: any, index: number) => ({
            index: scene.index || index + 1,
            type: this.mapSceneType(scene.type),
            visual_prompt: scene.visual_prompt || scene.visualPrompt,
            narration: scene.narration,
            text_overlay: scene.text_overlay || scene.textOverlay,
            duration_ms: scene.duration_ms || scene.durationMs || 5000,
          })),
          cta: parsed.cta,
          language,
        };
      }
    } catch (error) {
      console.error('Failed to parse script response:', error);
    }

    // إذا فشل التحليل، أعد سيناريو افتراضي
    return {
      title: 'إعلان المنتج',
      hook: 'اكتشف منتجنا المميز!',
      scenes: [
        {
          index: 1,
          type: 'intro' as SceneType,
          visual_prompt: 'Product reveal with elegant animation',
          narration: content.substring(0, 100),
          duration_ms: 5000,
        },
      ],
      cta: 'اطلب الآن!',
      language,
    };
  }

  /**
   * تحويل نوع المشهد
   */
  private mapSceneType(type: string): SceneType {
    const typeMap: Record<string, SceneType> = {
      intro: 'intro' as SceneType,
      image: 'image' as SceneType,
      video: 'video' as SceneType,
      ugc: 'ugc' as SceneType,
      text: 'text' as SceneType,
      cta: 'cta' as SceneType,
      transition: 'transition' as SceneType,
    };
    return typeMap[type?.toLowerCase()] || ('image' as SceneType);
  }

  /**
   * حساب التكلفة التقريبية
   */
  estimateCost(tokensUsed: number, model: string = this.defaultModel): number {
    const costPer1k = MODEL_COSTS[model as keyof typeof MODEL_COSTS] || 0.001;
    return (tokensUsed / 1000) * costPer1k;
  }

  /**
   * حساب الـ credits المطلوبة
   */
  calculateCredits(tokensUsed: number): number {
    // كل 1000 token = 1 credit
    return Math.ceil(tokensUsed / 1000);
  }
}

// Factory function
export function createOpenRouterService(apiKey: string): OpenRouterService {
  return new OpenRouterService({ apiKey });
}
