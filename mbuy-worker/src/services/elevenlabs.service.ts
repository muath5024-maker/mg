/**
 * ElevenLabs Service - خدمة توليد الصوت
 * يستخدم ElevenLabs API لتوليد أصوات بشرية عالية الجودة
 */

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

// الأصوات العربية المتاحة
export const ARABIC_VOICES = {
  ADAM: '21m00Tcm4TlvDq8ikWAM', // صوت ذكر عربي
  RACHEL: 'EXAVITQu4vr4xnSDxMaL', // صوت أنثى
  DOMI: 'AZnzlk1XvdvUeBnXmlld', // صوت ذكر
  BELLA: 'EXAVITQu4vr4xnSDxMaL', // صوت أنثى
  ANTONI: 'ErXwobaYiN019PkySvjV', // صوت ذكر
  ELLI: 'MF3mGyEYCl7XYWbV9V6O', // صوت أنثى
  JOSH: 'TxGEqnHWrfWFTfGW9XjX', // صوت ذكر
  ARNOLD: 'VR6AewLTigWG4xSOukaG', // صوت ذكر قوي
  SAM: 'yoZ06aMxZJJ28mfd3POQ', // صوت ذكر هادئ
} as const;

// النماذج المتاحة
export const ELEVENLABS_MODELS = {
  MULTILINGUAL_V2: 'eleven_multilingual_v2', // يدعم العربية
  TURBO_V2: 'eleven_turbo_v2', // سريع
  MONOLINGUAL_V1: 'eleven_monolingual_v1', // إنجليزي فقط
} as const;

export interface ElevenLabsServiceConfig {
  apiKey: string;
  defaultVoiceId?: string;
  defaultModel?: string;
}

export interface GenerateVoiceOptions {
  text: string;
  voiceId?: string;
  model?: string;
  stability?: number; // 0-1
  similarityBoost?: number; // 0-1
  style?: number; // 0-1
  useSpeakerBoost?: boolean;
  language?: string;
}

export interface GenerateVoiceResult {
  success: boolean;
  audioBuffer: ArrayBuffer;
  audioUrl?: string; // إذا تم الرفع لـ R2
  durationMs: number;
  creditsUsed: number;
  charactersUsed: number;
}

export interface Voice {
  voice_id: string;
  name: string;
  category: string;
  labels: Record<string, string>;
  preview_url?: string;
}

export class ElevenLabsService {
  private apiKey: string;
  private defaultVoiceId: string;
  private defaultModel: string;

  constructor(config: ElevenLabsServiceConfig) {
    this.apiKey = config.apiKey;
    this.defaultVoiceId = config.defaultVoiceId || ARABIC_VOICES.ADAM;
    this.defaultModel = config.defaultModel || ELEVENLABS_MODELS.MULTILINGUAL_V2;
  }

  /**
   * توليد صوت من نص
   */
  async generateVoice(options: GenerateVoiceOptions): Promise<GenerateVoiceResult> {
    const voiceId = options.voiceId || this.defaultVoiceId;
    const model = options.model || this.defaultModel;

    const requestBody = {
      text: options.text,
      model_id: model,
      voice_settings: {
        stability: options.stability ?? 0.5,
        similarity_boost: options.similarityBoost ?? 0.75,
        style: options.style ?? 0,
        use_speaker_boost: options.useSpeakerBoost ?? true,
      },
    };

    try {
      const response = await fetch(
        `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg',
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} - ${error}`);
      }

      const audioBuffer = await response.arrayBuffer();
      
      // حساب المدة التقريبية (128kbps MP3)
      const durationMs = Math.round((audioBuffer.byteLength * 8) / 128);
      
      // حساب الـ credits (كل 1000 حرف = 1 credit)
      const charactersUsed = options.text.length;
      const creditsUsed = Math.ceil(charactersUsed / 1000);

      return {
        success: true,
        audioBuffer,
        durationMs,
        creditsUsed,
        charactersUsed,
      };
    } catch (error) {
      console.error('ElevenLabs generation failed:', error);
      throw error;
    }
  }

  /**
   * توليد صوت بإعدادات محسنة للعربية
   */
  async generateArabicVoice(
    text: string,
    voiceType: 'male' | 'female' = 'male',
    speed: 'slow' | 'normal' | 'fast' = 'normal'
  ): Promise<GenerateVoiceResult> {
    // اختيار الصوت حسب النوع
    const voiceId = voiceType === 'male' ? ARABIC_VOICES.ADAM : ARABIC_VOICES.RACHEL;
    
    // تعديل الإعدادات حسب السرعة
    const stabilityMap = { slow: 0.7, normal: 0.5, fast: 0.3 };
    
    return this.generateVoice({
      text,
      voiceId,
      model: ELEVENLABS_MODELS.MULTILINGUAL_V2,
      stability: stabilityMap[speed],
      similarityBoost: 0.75,
      style: 0.5,
      useSpeakerBoost: true,
      language: 'ar',
    });
  }

  /**
   * توليد صوت لإعلان
   */
  async generateAdNarration(
    script: string[],
    voiceId?: string
  ): Promise<GenerateVoiceResult[]> {
    const results = await Promise.allSettled(
      script.map(text =>
        this.generateVoice({
          text,
          voiceId: voiceId || this.defaultVoiceId,
          stability: 0.5,
          similarityBoost: 0.8,
        })
      )
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      }
      return {
        success: false,
        audioBuffer: new ArrayBuffer(0),
        durationMs: 0,
        creditsUsed: 0,
        charactersUsed: script[index].length,
      };
    });
  }

  /**
   * الحصول على قائمة الأصوات المتاحة
   */
  async getVoices(): Promise<Voice[]> {
    try {
      const response = await fetch(`${ELEVENLABS_API_URL}/voices`, {
        headers: {
          'xi-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.status}`);
      }

      const data = await response.json() as {voices?: Voice[]};
      return data.voices || [];
    } catch (error) {
      console.error('Failed to fetch voices:', error);
      return [];
    }
  }

  /**
   * الحصول على معلومات الحساب والرصيد
   */
  async getSubscriptionInfo(): Promise<{
    characterCount: number;
    characterLimit: number;
    canExtendCharacterLimit: boolean;
    tier: string;
  }> {
    try {
      const response = await fetch(`${ELEVENLABS_API_URL}/user/subscription`, {
        headers: {
          'xi-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch subscription: ${response.status}`);
      }

      const data = await response.json() as {
        character_count?: number;
        character_limit?: number;
        can_extend_character_limit?: boolean;
        tier?: string;
      };
      return {
        characterCount: data.character_count || 0,
        characterLimit: data.character_limit || 10000,
        canExtendCharacterLimit: data.can_extend_character_limit || false,
        tier: data.tier || 'free',
      };
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
      return {
        characterCount: 0,
        characterLimit: 10000,
        canExtendCharacterLimit: false,
        tier: 'free',
      };
    }
  }

  /**
   * تحقق من صلاحية API Key
   */
  async validateApiKey(): Promise<boolean> {
    try {
      const response = await fetch(`${ELEVENLABS_API_URL}/user`, {
        headers: {
          'xi-api-key': this.apiKey,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * حساب التكلفة المتوقعة
   */
  calculateCredits(text: string): number {
    return Math.ceil(text.length / 1000);
  }

  /**
   * تقدير مدة الصوت بالمللي ثانية
   */
  estimateDuration(text: string, wordsPerMinute: number = 150): number {
    // حساب عدد الكلمات
    const wordCount = text.split(/\s+/).length;
    // حساب المدة بالدقائق ثم تحويل لمللي ثانية
    return Math.round((wordCount / wordsPerMinute) * 60 * 1000);
  }

  /**
   * الأصوات الموصى بها للعربية
   */
  getRecommendedArabicVoices(): Array<{ id: string; name: string; gender: string }> {
    return [
      { id: ARABIC_VOICES.ADAM, name: 'آدم', gender: 'male' },
      { id: ARABIC_VOICES.JOSH, name: 'جوش', gender: 'male' },
      { id: ARABIC_VOICES.SAM, name: 'سام', gender: 'male' },
      { id: ARABIC_VOICES.RACHEL, name: 'راشيل', gender: 'female' },
      { id: ARABIC_VOICES.BELLA, name: 'بيلا', gender: 'female' },
    ];
  }
}

// Factory function
export function createElevenLabsService(apiKey: string): ElevenLabsService {
  return new ElevenLabsService({ apiKey });
}
