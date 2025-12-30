/**
 * Fal.ai Service - خدمة توليد الصور
 * يستخدم Fal.ai API لتوليد صور بـ Flux و نماذج أخرى
 */

import type { FalImageRequest, FalImageResponse } from '../types/studio.types';
import { AspectRatio } from '../types/studio.types';

const FAL_API_URL = 'https://fal.run';

// النماذج المتاحة
export const FAL_MODELS = {
  FLUX_SCHNELL: 'fal-ai/flux/schnell', // سريع ومجاني تقريباً
  FLUX_DEV: 'fal-ai/flux/dev', // جودة أعلى
  FLUX_PRO: 'fal-ai/flux-pro', // أعلى جودة
  FLUX_REALISM: 'fal-ai/flux-realism', // واقعي جداً
  STABLE_DIFFUSION_XL: 'fal-ai/stable-diffusion-xl', // بديل
} as const;

// تكلفة كل صورة بالـ credits
const MODEL_CREDITS = {
  [FAL_MODELS.FLUX_SCHNELL]: 1,
  [FAL_MODELS.FLUX_DEV]: 2,
  [FAL_MODELS.FLUX_PRO]: 5,
  [FAL_MODELS.FLUX_REALISM]: 3,
  [FAL_MODELS.STABLE_DIFFUSION_XL]: 2,
};

// أحجام الصور حسب نسبة العرض
const ASPECT_RATIO_SIZES: Record<AspectRatio, { width: number; height: number }> = {
  '9:16': { width: 768, height: 1344 },
  '16:9': { width: 1344, height: 768 },
  '1:1': { width: 1024, height: 1024 },
};

export interface FalServiceConfig {
  apiKey: string;
  defaultModel?: string;
}

export interface GenerateImageOptions {
  prompt: string;
  negativePrompt?: string;
  aspectRatio?: AspectRatio;
  style?: 'realistic' | 'illustration' | 'minimal' | '3d' | 'product';
  numImages?: number;
  seed?: number;
  model?: string;
}

export interface GenerateImageResult {
  success: boolean;
  images: Array<{
    url: string;
    width: number;
    height: number;
  }>;
  seed: number;
  creditsUsed: number;
  model: string;
}

export class FalService {
  private apiKey: string;
  private defaultModel: string;

  constructor(config: FalServiceConfig) {
    this.apiKey = config.apiKey;
    this.defaultModel = config.defaultModel || FAL_MODELS.FLUX_SCHNELL;
  }

  /**
   * توليد صورة
   */
  async generateImage(options: GenerateImageOptions): Promise<GenerateImageResult> {
    const model = options.model || this.defaultModel;
    const size = ASPECT_RATIO_SIZES[options.aspectRatio || '9:16'];

    // تحسين الـ prompt حسب الأسلوب
    const enhancedPrompt = this.enhancePrompt(options.prompt, options.style);

    const requestBody: FalImageRequest = {
      prompt: enhancedPrompt,
      negative_prompt: options.negativePrompt || this.getDefaultNegativePrompt(),
      image_size: size,
      num_images: options.numImages || 1,
      seed: options.seed,
    };

    try {
      const response = await fetch(`${FAL_API_URL}/${model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Fal.ai API error: ${response.status} - ${error}`);
      }

      const result: FalImageResponse = await response.json();

      return {
        success: true,
        images: result.images || [],
        seed: result.seed,
        creditsUsed: MODEL_CREDITS[model as keyof typeof MODEL_CREDITS] || 2,
        model,
      };
    } catch (error) {
      console.error('Fal.ai generation failed:', error);
      throw error;
    }
  }

  /**
   * توليد صورة منتج احترافية
   */
  async generateProductImage(
    productName: string,
    productDescription: string,
    sceneType: 'hero' | 'lifestyle' | 'closeup' | 'packaging' | 'feature',
    aspectRatio: AspectRatio = AspectRatio.PORTRAIT
  ): Promise<GenerateImageResult> {
    const scenePrompts: Record<string, string> = {
      hero: `Professional product photography of ${productName}, ${productDescription}, studio lighting, clean white background, high-end commercial photography, sharp focus, centered composition`,
      lifestyle: `${productName} in a lifestyle setting, ${productDescription}, natural lighting, modern home environment, aspirational, warm tones, professional photography`,
      closeup: `Extreme close-up detail shot of ${productName}, ${productDescription}, macro photography, showing texture and quality, studio lighting, sharp focus`,
      packaging: `${productName} elegant packaging, ${productDescription}, premium unboxing experience, studio shot, clean background, professional product photography`,
      feature: `${productName} highlighting key features, ${productDescription}, infographic style, clean modern design, professional photography, feature callouts`,
    };

    const prompt = scenePrompts[sceneType] || scenePrompts.hero;

    return this.generateImage({
      prompt,
      aspectRatio,
      style: 'product',
      model: FAL_MODELS.FLUX_DEV, // جودة أعلى للمنتجات
    });
  }

  /**
   * توليد خلفية للفيديو
   */
  async generateBackground(
    theme: string,
    mood: 'bright' | 'dark' | 'warm' | 'cool' | 'neutral',
    aspectRatio: AspectRatio = AspectRatio.PORTRAIT
  ): Promise<GenerateImageResult> {
    const moodModifiers: Record<string, string> = {
      bright: 'bright, well-lit, cheerful, white and light colors',
      dark: 'dark, moody, dramatic lighting, deep colors',
      warm: 'warm tones, golden hour lighting, cozy atmosphere',
      cool: 'cool tones, blue and silver colors, clean and modern',
      neutral: 'neutral colors, minimalist, clean and professional',
    };

    const prompt = `Abstract background for ${theme}, ${moodModifiers[mood]}, suitable for video overlay, smooth gradients, professional design, 8k quality`;

    return this.generateImage({
      prompt,
      aspectRatio,
      style: 'minimal',
      model: FAL_MODELS.FLUX_SCHNELL, // سريع للخلفيات
    });
  }

  /**
   * تحسين الـ prompt
   */
  private enhancePrompt(prompt: string, style?: string): string {
    const styleEnhancements: Record<string, string> = {
      realistic: ', photorealistic, 8k uhd, high detail, professional photography, natural lighting',
      illustration: ', digital illustration, vector art style, clean lines, modern design',
      minimal: ', minimalist design, clean, simple, lots of white space, modern',
      '3d': ', 3d render, octane render, high quality, realistic materials, studio lighting',
      product: ', professional product photography, studio lighting, commercial quality, sharp focus, high-end',
    };

    const enhancement = styleEnhancements[style || 'realistic'] || styleEnhancements.realistic;
    return prompt + enhancement;
  }

  /**
   * Negative prompt افتراضي
   */
  private getDefaultNegativePrompt(): string {
    return 'blurry, low quality, distorted, ugly, bad anatomy, watermark, signature, text, logo, worst quality, low resolution, grainy, pixelated, overexposed, underexposed';
  }

  /**
   * توليد صور متعددة بالتوازي
   */
  async generateMultipleImages(
    prompts: Array<GenerateImageOptions>
  ): Promise<GenerateImageResult[]> {
    const results = await Promise.allSettled(
      prompts.map(options => this.generateImage(options))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      }
      return {
        success: false,
        images: [],
        seed: 0,
        creditsUsed: 0,
        model: prompts[index].model || this.defaultModel,
      };
    });
  }

  /**
   * تحقق من صلاحية API Key
   */
  async validateApiKey(): Promise<boolean> {
    try {
      // طلب بسيط للتحقق
      const response = await fetch(`${FAL_API_URL}/${FAL_MODELS.FLUX_SCHNELL}`, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'test',
          image_size: { width: 64, height: 64 },
          num_images: 0, // لا نريد صورة فعلية
        }),
      });
      
      // حتى لو فشل الطلب، نتحقق من أن الـ key صالح
      return response.status !== 401 && response.status !== 403;
    } catch {
      return false;
    }
  }

  /**
   * حساب التكلفة
   */
  calculateCredits(model: string, numImages: number = 1): number {
    const baseCost = MODEL_CREDITS[model as keyof typeof MODEL_CREDITS] || 2;
    return baseCost * numImages;
  }

  /**
   * الحصول على النماذج المتاحة
   */
  getAvailableModels(): Array<{ id: string; name: string; credits: number }> {
    return [
      { id: FAL_MODELS.FLUX_SCHNELL, name: 'Flux Schnell (سريع)', credits: 1 },
      { id: FAL_MODELS.FLUX_DEV, name: 'Flux Dev (متوازن)', credits: 2 },
      { id: FAL_MODELS.FLUX_PRO, name: 'Flux Pro (احترافي)', credits: 5 },
      { id: FAL_MODELS.FLUX_REALISM, name: 'Flux Realism (واقعي)', credits: 3 },
    ];
  }
}

// Factory function
export function createFalService(apiKey: string): FalService {
  return new FalService({ apiKey });
}
