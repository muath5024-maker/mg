/**
 * Render Service - خدمة دمج وتصدير الفيديو
 * يستخدم تقنيات متعددة للدمج:
 * 1. FFmpeg (محلياً في Flutter)
 * 2. خدمة Cloudflare Stream (اختياري)
 */

import type {
  StudioProject,
  StudioScene,
  RenderStatus,
  AspectRatio,
} from '../types/studio.types';

// إعدادات الجودة
export const RENDER_QUALITY = {
  LOW: {
    name: 'low',
    resolution: '720p',
    width: 720,
    height: 1280,
    bitrate: '2M',
    fps: 24,
    creditsMultiplier: 1,
  },
  MEDIUM: {
    name: 'medium',
    resolution: '1080p',
    width: 1080,
    height: 1920,
    bitrate: '5M',
    fps: 30,
    creditsMultiplier: 2,
  },
  HIGH: {
    name: 'high',
    resolution: '1080p',
    width: 1080,
    height: 1920,
    bitrate: '10M',
    fps: 60,
    creditsMultiplier: 3,
  },
} as const;

// أوامر FFmpeg للتأثيرات
export const FFMPEG_TRANSITIONS = {
  fade: 'fade=t=in:st=0:d=0.5',
  fadeOut: 'fade=t=out:st=${duration}:d=0.5',
  slideLeft: 'slide=direction=left:start=0:duration=0.5',
  slideRight: 'slide=direction=right:start=0:duration=0.5',
  zoom: 'zoompan=z=\'min(zoom+0.0015,1.5)\':d=25',
  blur: 'boxblur=5:1',
} as const;

export interface RenderServiceConfig {
  r2Bucket?: R2Bucket;
  supabase?: any;
}

export interface RenderJobInput {
  project: StudioProject;
  scenes: StudioScene[];
  quality: 'low' | 'medium' | 'high';
  format: 'mp4' | 'webm';
  includeAudio: boolean;
  includeWatermark: boolean;
}

export interface RenderJobResult {
  success: boolean;
  outputUrl?: string;
  thumbnailUrl?: string;
  durationMs: number;
  fileSizeBytes: number;
  creditsUsed: number;
}

export interface FFmpegCommand {
  inputs: string[];
  filters: string[];
  output: string;
  options: string[];
}

export class RenderService {
  private r2Bucket?: R2Bucket;
  private supabase?: any;

  constructor(config: RenderServiceConfig = {}) {
    this.r2Bucket = config.r2Bucket;
    this.supabase = config.supabase;
  }

  /**
   * إعداد أمر FFmpeg للمشروع
   * هذا يولد الأمر الذي سيتم تنفيذه في Flutter
   */
  generateFFmpegCommand(input: RenderJobInput): FFmpegCommand {
    const quality = RENDER_QUALITY[input.quality.toUpperCase() as keyof typeof RENDER_QUALITY];
    const command: FFmpegCommand = {
      inputs: [],
      filters: [],
      output: `output.${input.format}`,
      options: [],
    };

    // إضافة المدخلات (المشاهد)
    input.scenes
      .sort((a, b) => a.order_index - b.order_index)
      .forEach((scene, index) => {
        if (scene.generated_video_url) {
          command.inputs.push(`-i "${scene.generated_video_url}"`);
        } else if (scene.generated_image_url) {
          // تحويل الصورة لفيديو بمدة محددة
          const duration = scene.duration_ms / 1000;
          command.inputs.push(`-loop 1 -t ${duration} -i "${scene.generated_image_url}"`);
        }
      });

    // إضافة الصوت إذا موجود
    const audioScenes = input.scenes.filter(s => s.generated_audio_url);
    if (input.includeAudio && audioScenes.length > 0) {
      audioScenes.forEach(scene => {
        command.inputs.push(`-i "${scene.generated_audio_url}"`);
      });
    }

    // بناء الفلاتر
    const filterComplex: string[] = [];
    const sceneCount = input.scenes.length;

    // تطبيع أحجام جميع المشاهد
    for (let i = 0; i < sceneCount; i++) {
      filterComplex.push(
        `[${i}:v]scale=${quality.width}:${quality.height}:force_original_aspect_ratio=decrease,` +
        `pad=${quality.width}:${quality.height}:(ow-iw)/2:(oh-ih)/2,setsar=1[v${i}]`
      );
    }

    // دمج المشاهد مع الانتقالات
    let concatInputs = '';
    for (let i = 0; i < sceneCount; i++) {
      concatInputs += `[v${i}]`;
    }
    filterComplex.push(`${concatInputs}concat=n=${sceneCount}:v=1:a=0[outv]`);

    // إضافة علامة مائية إذا مطلوب
    if (input.includeWatermark && input.project.settings.logo_url) {
      filterComplex.push(
        `[outv][logo]overlay=W-w-10:H-h-10[outwm]`
      );
      command.inputs.push(`-i "${input.project.settings.logo_url}"`);
    }

    command.filters = filterComplex;

    // خيارات الإخراج
    command.options = [
      `-c:v libx264`,
      `-preset medium`,
      `-crf 23`,
      `-b:v ${quality.bitrate}`,
      `-r ${quality.fps}`,
      `-pix_fmt yuv420p`,
      `-movflags +faststart`,
    ];

    if (input.includeAudio && audioScenes.length > 0) {
      command.options.push(`-c:a aac`, `-b:a 128k`);
    }

    return command;
  }

  /**
   * إنشاء JSON مبسط لـ Flutter
   * سيتم تحويله لأمر FFmpeg في التطبيق
   */
  generateRenderManifest(input: RenderJobInput): {
    scenes: Array<{
      index: number;
      type: 'image' | 'video';
      url: string;
      duration: number;
      audioUrl?: string;
      transition: string;
      layers: any[];
    }>;
    settings: {
      width: number;
      height: number;
      fps: number;
      format: string;
      quality: string;
    };
    overlays: {
      logo?: { url: string; position: string };
      watermark?: { text: string; position: string };
    };
  } {
    const quality = RENDER_QUALITY[input.quality.toUpperCase() as keyof typeof RENDER_QUALITY];

    return {
      scenes: input.scenes
        .sort((a, b) => a.order_index - b.order_index)
        .map(scene => ({
          index: scene.order_index,
          type: scene.generated_video_url ? 'video' : 'image',
          url: scene.generated_video_url || scene.generated_image_url || '',
          duration: scene.duration_ms,
          audioUrl: scene.generated_audio_url,
          transition: scene.transition_in,
          layers: scene.layers,
        })),
      settings: {
        width: quality.width,
        height: quality.height,
        fps: quality.fps,
        format: input.format,
        quality: input.quality,
      },
      overlays: {
        logo: input.project.settings.logo_url
          ? { url: input.project.settings.logo_url, position: 'bottom-right' }
          : undefined,
      },
    };
  }

  /**
   * حساب credits الرندر
   */
  calculateRenderCredits(input: RenderJobInput): number {
    const quality = RENDER_QUALITY[input.quality.toUpperCase() as keyof typeof RENDER_QUALITY];
    const totalDurationMs = input.scenes.reduce((sum, s) => sum + s.duration_ms, 0);
    const durationMinutes = Math.ceil(totalDurationMs / 60000);
    
    // كل دقيقة = 5 credits × معامل الجودة
    return durationMinutes * 5 * quality.creditsMultiplier;
  }

  /**
   * حفظ الفيديو في R2
   */
  async saveToR2(
    videoBuffer: ArrayBuffer,
    projectId: string,
    fileName: string
  ): Promise<string> {
    if (!this.r2Bucket) {
      throw new Error('R2 bucket not configured');
    }

    const key = `renders/${projectId}/${fileName}`;
    
    await this.r2Bucket.put(key, videoBuffer, {
      httpMetadata: {
        contentType: 'video/mp4',
      },
    });

    // إرجاع رابط عام (يحتاج تكوين R2 public access)
    return `https://r2.mbuy.app/${key}`;
  }

  /**
   * إنشاء Thumbnail من الفيديو
   * يولد أمر FFmpeg لاستخراج صورة
   */
  generateThumbnailCommand(videoUrl: string, outputPath: string, timeSeconds: number = 1): string {
    return `-i "${videoUrl}" -ss ${timeSeconds} -vframes 1 -q:v 2 "${outputPath}"`;
  }

  /**
   * تقدير وقت الرندر
   */
  estimateRenderTime(input: RenderJobInput): number {
    const quality = RENDER_QUALITY[input.quality.toUpperCase() as keyof typeof RENDER_QUALITY];
    const totalDurationMs = input.scenes.reduce((sum, s) => sum + s.duration_ms, 0);
    
    // تقدير: وقت الرندر = مدة الفيديو × معامل الجودة × 2
    return Math.ceil((totalDurationMs / 1000) * quality.creditsMultiplier * 2);
  }

  /**
   * الحصول على إعدادات الجودة
   */
  getQualityOptions(): Array<{
    id: string;
    name: string;
    resolution: string;
    credits: number;
  }> {
    return [
      { id: 'low', name: 'اقتصادي', resolution: '720p', credits: 5 },
      { id: 'medium', name: 'عالي', resolution: '1080p', credits: 10 },
      { id: 'high', name: 'احترافي', resolution: '1080p 60fps', credits: 15 },
    ];
  }

  /**
   * أنواع الانتقالات المتاحة
   */
  getAvailableTransitions(): Array<{ id: string; name: string }> {
    return [
      { id: 'fade', name: 'تلاشي' },
      { id: 'slide_left', name: 'انزلاق يسار' },
      { id: 'slide_right', name: 'انزلاق يمين' },
      { id: 'zoom', name: 'تكبير' },
      { id: 'none', name: 'بدون' },
    ];
  }
}

// Factory function
export function createRenderService(config?: RenderServiceConfig): RenderService {
  return new RenderService(config);
}

// Helper: إنشاء أمر FFmpeg كامل كنص
export function buildFFmpegCommandString(command: FFmpegCommand): string {
  const parts: string[] = ['ffmpeg'];
  
  // المدخلات
  parts.push(...command.inputs);
  
  // الفلاتر
  if (command.filters.length > 0) {
    parts.push(`-filter_complex "${command.filters.join(';')}"`);
  }
  
  // خيارات الإخراج
  parts.push(...command.options);
  
  // ملف الإخراج
  parts.push(command.output);
  
  return parts.join(' ');
}
