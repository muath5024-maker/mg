/**
 * D-ID Service - خدمة توليد فيديوهات UGC
 * يستخدم D-ID API لتوليد فيديوهات بوجوه تتحدث
 */

const DID_API_URL = 'https://api.d-id.com';

// الأفاتارات المتاحة
export const DID_AVATARS = {
  MALE_1: 'amy-jcwCkr1grs', // ذكر
  FEMALE_1: 'amy-Aq6OmGZnMt', // أنثى
  MALE_2: 'jack-dGbZsio8kP', // ذكر آخر
  FEMALE_2: 'emma-CZCcDsRm9k', // أنثى أخرى
} as const;

// مصادر الصوت
export const VOICE_PROVIDERS = {
  ELEVENLABS: 'elevenlabs',
  MICROSOFT: 'microsoft',
  AMAZON: 'amazon',
} as const;

export interface DIDServiceConfig {
  apiKey: string;
  defaultAvatarId?: string;
}

export interface GenerateUGCOptions {
  script: string;
  avatarUrl?: string; // رابط صورة مخصصة للوجه
  avatarId?: string; // أو استخدام avatar جاهز
  voiceId?: string; // صوت ElevenLabs
  voiceProvider?: string;
  backgroundColor?: string;
  driverExpression?: 'neutral' | 'happy' | 'serious';
}

export interface GenerateUGCResult {
  success: boolean;
  talkId: string;
  status: 'created' | 'started' | 'done' | 'error';
  resultUrl?: string;
  thumbnailUrl?: string;
  durationMs?: number;
  creditsUsed: number;
}

export interface TalkStatus {
  id: string;
  status: 'created' | 'started' | 'done' | 'error';
  result_url?: string;
  thumbnail_url?: string;
  duration?: number;
  error?: {
    kind: string;
    description: string;
  };
}

export class DIDService {
  private apiKey: string;
  private defaultAvatarId: string;

  constructor(config: DIDServiceConfig) {
    this.apiKey = config.apiKey;
    this.defaultAvatarId = config.defaultAvatarId || DID_AVATARS.MALE_1;
  }

  /**
   * إنشاء فيديو UGC
   */
  async createTalk(options: GenerateUGCOptions): Promise<GenerateUGCResult> {
    const sourceUrl = options.avatarUrl || this.getAvatarUrl(options.avatarId);

    const requestBody: any = {
      script: {
        type: 'text',
        input: options.script,
        subtitles: false,
      },
      source_url: sourceUrl,
      config: {
        stitch: true, // دمج الصوت مع الفيديو
        result_format: 'mp4',
      },
    };

    // إضافة مزود الصوت إذا تم تحديده
    if (options.voiceId && options.voiceProvider === VOICE_PROVIDERS.ELEVENLABS) {
      requestBody.script.provider = {
        type: 'elevenlabs',
        voice_id: options.voiceId,
      };
    }

    // إعدادات إضافية
    if (options.backgroundColor) {
      requestBody.config.background = {
        color: options.backgroundColor,
      };
    }

    if (options.driverExpression) {
      requestBody.driver_expression = options.driverExpression;
    }

    try {
      const response = await fetch(`${DID_API_URL}/talks`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`D-ID API error: ${response.status} - ${JSON.stringify(error)}`);
      }

      const data = await response.json() as {id: string; status?: 'created' | 'started' | 'done' | 'error'};

      return {
        success: true,
        talkId: data.id,
        status: data.status ?? 'created',
        creditsUsed: this.calculateCredits(options.script),
      };
    } catch (error) {
      console.error('D-ID creation failed:', error);
      throw error;
    }
  }

  /**
   * التحقق من حالة الفيديو
   */
  async getTalkStatus(talkId: string): Promise<TalkStatus> {
    try {
      const response = await fetch(`${DID_API_URL}/talks/${talkId}`, {
        headers: {
          'Authorization': `Basic ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`D-ID API error: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('D-ID status check failed:', error);
      throw error;
    }
  }

  /**
   * انتظار اكتمال الفيديو
   */
  async waitForCompletion(
    talkId: string,
    maxWaitMs: number = 300000, // 5 دقائق
    pollIntervalMs: number = 5000
  ): Promise<GenerateUGCResult> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      const status = await this.getTalkStatus(talkId);

      if (status.status === 'done') {
        return {
          success: true,
          talkId,
          status: 'done',
          resultUrl: status.result_url,
          thumbnailUrl: status.thumbnail_url,
          durationMs: status.duration ? status.duration * 1000 : undefined,
          creditsUsed: 0, // تم حسابها عند الإنشاء
        };
      }

      if (status.status === 'error') {
        throw new Error(`D-ID generation failed: ${status.error?.description || 'Unknown error'}`);
      }

      // انتظار قبل الاستعلام مرة أخرى
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    }

    throw new Error('D-ID generation timeout');
  }

  /**
   * إنشاء فيديو UGC وانتظار النتيجة
   */
  async generateUGC(options: GenerateUGCOptions): Promise<GenerateUGCResult> {
    const createResult = await this.createTalk(options);
    
    if (!createResult.success) {
      return createResult;
    }

    // انتظار الاكتمال
    const finalResult = await this.waitForCompletion(createResult.talkId);
    
    return {
      ...finalResult,
      creditsUsed: createResult.creditsUsed,
    };
  }

  /**
   * الحصول على رابط Avatar
   */
  private getAvatarUrl(avatarId?: string): string {
    // D-ID يحتاج رابط صورة، هذه روابط افتراضية
    const avatarUrls: Record<string, string> = {
      [DID_AVATARS.MALE_1]: 'https://create-images-results.d-id.com/DefaultPresenters/amy_jcwCkr1grs/image.jpeg',
      [DID_AVATARS.FEMALE_1]: 'https://create-images-results.d-id.com/DefaultPresenters/amy_Aq6OmGZnMt/image.jpeg',
      [DID_AVATARS.MALE_2]: 'https://create-images-results.d-id.com/DefaultPresenters/jack_dGbZsio8kP/image.jpeg',
      [DID_AVATARS.FEMALE_2]: 'https://create-images-results.d-id.com/DefaultPresenters/emma_CZCcDsRm9k/image.jpeg',
    };

    return avatarUrls[avatarId || this.defaultAvatarId] || avatarUrls[DID_AVATARS.MALE_1];
  }

  /**
   * الحصول على قائمة الأفاتارات المتاحة
   */
  async getAvatars(): Promise<any[]> {
    try {
      const response = await fetch(`${DID_API_URL}/clips/actors`, {
        headers: {
          'Authorization': `Basic ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json() as {actors?: unknown[]};
      return data.actors || [];
    } catch {
      return [];
    }
  }

  /**
   * الحصول على معلومات الاستخدام
   */
  async getUsageInfo(): Promise<{
    creditsUsed: number;
    creditsRemaining: number;
  }> {
    try {
      const response = await fetch(`${DID_API_URL}/credits`, {
        headers: {
          'Authorization': `Basic ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        return { creditsUsed: 0, creditsRemaining: 0 };
      }

      const data = await response.json() as {used?: number; remaining?: number};
      return {
        creditsUsed: data.used || 0,
        creditsRemaining: data.remaining || 0,
      };
    } catch {
      return { creditsUsed: 0, creditsRemaining: 0 };
    }
  }

  /**
   * حساب التكلفة
   * D-ID يحسب بالدقيقة، تقريباً 150 كلمة = دقيقة
   */
  calculateCredits(script: string): number {
    const wordCount = script.split(/\s+/).length;
    const estimatedMinutes = Math.ceil(wordCount / 150);
    // كل دقيقة = 5 credits تقريباً
    return estimatedMinutes * 5;
  }

  /**
   * تقدير مدة الفيديو
   */
  estimateDuration(script: string, wordsPerMinute: number = 150): number {
    const wordCount = script.split(/\s+/).length;
    return Math.round((wordCount / wordsPerMinute) * 60 * 1000);
  }

  /**
   * تحقق من صلاحية API Key
   */
  async validateApiKey(): Promise<boolean> {
    try {
      const response = await fetch(`${DID_API_URL}/credits`, {
        headers: {
          'Authorization': `Basic ${this.apiKey}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * الأفاتارات الموصى بها
   */
  getRecommendedAvatars(): Array<{ id: string; name: string; gender: string }> {
    return [
      { id: DID_AVATARS.MALE_1, name: 'أحمد', gender: 'male' },
      { id: DID_AVATARS.MALE_2, name: 'جاك', gender: 'male' },
      { id: DID_AVATARS.FEMALE_1, name: 'سارة', gender: 'female' },
      { id: DID_AVATARS.FEMALE_2, name: 'إيما', gender: 'female' },
    ];
  }
}

// Factory function
export function createDIDService(apiKey: string): DIDService {
  return new DIDService({ apiKey });
}
