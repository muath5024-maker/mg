/**
 * Generation Tools Types - تعريفات أدوات التوليد
 */

// =====================================================
// Tool Categories
// =====================================================

export enum ToolCategory {
  EDIT = 'edit',
  GENERATE = 'generate',
}

export enum EditToolType {
  REMOVE_BACKGROUND = 'remove_background',
  ENHANCE_QUALITY = 'enhance_quality',
  RESIZE = 'resize',
  CROP = 'crop',
  ADD_FILTER = 'add_filter',
  ADD_TEXT = 'add_text',
  // Video specific
  TRIM_VIDEO = 'trim_video',
  MERGE_VIDEOS = 'merge_videos',
  ADD_MUSIC = 'add_music',
  ADD_SUBTITLES = 'add_subtitles',
  EXTRACT_AUDIO = 'extract_audio',
  VIDEO_TO_GIF = 'video_to_gif',
}

export enum GenerateToolType {
  TEMPLATES = 'templates',
  PRODUCT_IMAGES = 'product_images',
  LANDING_PAGE = 'landing_page',
  BANNER = 'banner',
  ANIMATED_IMAGE = 'animated_image',
  SHORT_VIDEO = 'short_video',
  LOGO = 'logo',
}

// =====================================================
// Edit Tools
// =====================================================

export interface EditToolDefinition {
  id: EditToolType;
  name: string;
  name_ar: string;
  description: string;
  description_ar: string;
  icon: string;
  credits_cost: number;
  supports_image: boolean;
  supports_video: boolean;
  parameters: EditToolParameter[];
}

export interface EditToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'color' | 'file';
  required: boolean;
  default?: any;
  options?: { value: string; label: string; label_ar: string }[];
  min?: number;
  max?: number;
}

// =====================================================
// Generate Tools
// =====================================================

export interface GenerateToolDefinition {
  id: GenerateToolType;
  name: string;
  name_ar: string;
  description: string;
  description_ar: string;
  icon: string;
  credits_cost: number;
  estimated_time_seconds: number;
  parameters: GenerateToolParameter[];
}

export interface GenerateToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'color' | 'file' | 'product';
  required: boolean;
  default?: any;
  options?: { value: string; label: string; label_ar: string }[];
  min?: number;
  max?: number;
  placeholder?: string;
  placeholder_ar?: string;
}

// =====================================================
// Tool Requests
// =====================================================

// Edit Requests
export interface RemoveBackgroundRequest {
  image_url: string;
  output_format?: 'png' | 'webp';
}

export interface EnhanceQualityRequest {
  media_url: string;
  media_type: 'image' | 'video';
  enhancement_level?: 'light' | 'medium' | 'strong';
}

export interface ResizeRequest {
  media_url: string;
  media_type: 'image' | 'video';
  width: number;
  height: number;
  maintain_aspect_ratio?: boolean;
}

export interface AddFilterRequest {
  media_url: string;
  media_type: 'image' | 'video';
  filter: string;
  intensity?: number;
}

export interface TrimVideoRequest {
  video_url: string;
  start_time_ms: number;
  end_time_ms: number;
}

export interface MergeVideosRequest {
  video_urls: string[];
  transition?: 'none' | 'fade' | 'slide' | 'zoom';
}

export interface AddMusicRequest {
  video_url: string;
  audio_url?: string;
  music_style?: string;
  volume?: number;
}

export interface AddSubtitlesRequest {
  video_url: string;
  subtitles?: { start_ms: number; end_ms: number; text: string }[];
  auto_generate?: boolean;
  language?: string;
  style?: 'default' | 'minimal' | 'bold' | 'animated';
}

// Generate Requests
export interface GenerateProductImagesRequest {
  product_id?: string;
  product_name: string;
  product_description?: string;
  existing_image_url?: string;
  style: 'product_photo' | 'lifestyle' | 'minimal' | '3d_render' | 'flat_lay';
  background?: 'white' | 'gradient' | 'scene' | 'transparent';
  num_images?: number;
  aspect_ratio?: '1:1' | '4:3' | '16:9' | '9:16';
}

export interface GenerateLandingPageRequest {
  product_id?: string;
  product_data: {
    name: string;
    description: string;
    price: number;
    features: string[];
    images: string[];
  };
  template_style?: 'modern' | 'minimal' | 'bold' | 'elegant';
  include_sections?: ('hero' | 'features' | 'gallery' | 'testimonials' | 'cta' | 'faq')[];
  color_scheme?: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export interface GenerateBannerRequest {
  title: string;
  subtitle?: string;
  product_image_url?: string;
  background_style?: 'solid' | 'gradient' | 'image' | 'pattern';
  background_color?: string;
  size: 'web_header' | 'web_sidebar' | 'social_post' | 'social_story' | 'custom';
  custom_width?: number;
  custom_height?: number;
  cta_text?: string;
}

export interface GenerateAnimatedImageRequest {
  base_image_url?: string;
  prompt?: string;
  animation_type: 'zoom' | 'pan' | 'rotate' | 'bounce' | 'pulse' | 'sparkle' | 'custom';
  duration_ms?: number;
  output_format?: 'gif' | 'webp' | 'mp4';
}

export interface GenerateShortVideoRequest {
  product_id?: string;
  product_data: {
    name: string;
    description?: string;
    price?: number;
    images: string[];
  };
  video_type: 'product_showcase' | 'promo' | 'unboxing' | 'comparison' | 'tutorial';
  duration_seconds: 15 | 30 | 60;
  aspect_ratio: '9:16' | '16:9' | '1:1';
  include_music?: boolean;
  include_voiceover?: boolean;
  voice_gender?: 'male' | 'female';
  language?: 'ar' | 'en';
}

export interface GenerateLogoRequest {
  brand_name: string;
  industry?: string;
  style: 'modern' | 'classic' | 'playful' | 'minimal' | 'geometric' | 'hand_drawn';
  colors?: string[];
  include_icon?: boolean;
  include_text?: boolean;
  num_variations?: number;
}

// =====================================================
// Tool Responses
// =====================================================

export interface EditToolResponse {
  success: boolean;
  result_url: string;
  thumbnail_url?: string;
  file_size_bytes?: number;
  processing_time_ms: number;
  credits_used: number;
}

export interface GenerateToolResponse {
  success: boolean;
  results: GeneratedAsset[];
  credits_used: number;
  processing_time_ms: number;
}

export interface GeneratedAsset {
  id: string;
  url: string;
  thumbnail_url?: string;
  type: 'image' | 'video' | 'gif' | 'html' | 'svg';
  width?: number;
  height?: number;
  duration_ms?: number;
  file_size_bytes?: number;
  metadata?: Record<string, unknown>;
}

// =====================================================
// Tool Definitions (Static)
// =====================================================

export const EDIT_TOOLS: EditToolDefinition[] = [
  {
    id: EditToolType.REMOVE_BACKGROUND,
    name: 'Remove Background',
    name_ar: 'إزالة الخلفية',
    description: 'Remove background from images',
    description_ar: 'إزالة الخلفية من الصور',
    icon: 'content_cut',
    credits_cost: 1,
    supports_image: true,
    supports_video: false,
    parameters: [
      { name: 'output_format', type: 'select', required: false, default: 'png', options: [
        { value: 'png', label: 'PNG', label_ar: 'PNG' },
        { value: 'webp', label: 'WebP', label_ar: 'WebP' },
      ]},
    ],
  },
  {
    id: EditToolType.ENHANCE_QUALITY,
    name: 'Enhance Quality',
    name_ar: 'تحسين الجودة',
    description: 'Improve image or video quality',
    description_ar: 'تحسين جودة الصورة أو الفيديو',
    icon: 'auto_fix_high',
    credits_cost: 2,
    supports_image: true,
    supports_video: true,
    parameters: [
      { name: 'enhancement_level', type: 'select', required: false, default: 'medium', options: [
        { value: 'light', label: 'Light', label_ar: 'خفيف' },
        { value: 'medium', label: 'Medium', label_ar: 'متوسط' },
        { value: 'strong', label: 'Strong', label_ar: 'قوي' },
      ]},
    ],
  },
  {
    id: EditToolType.RESIZE,
    name: 'Resize',
    name_ar: 'تغيير الحجم',
    description: 'Resize image or video',
    description_ar: 'تغيير حجم الصورة أو الفيديو',
    icon: 'aspect_ratio',
    credits_cost: 1,
    supports_image: true,
    supports_video: true,
    parameters: [
      { name: 'width', type: 'number', required: true, min: 100, max: 4096 },
      { name: 'height', type: 'number', required: true, min: 100, max: 4096 },
      { name: 'maintain_aspect_ratio', type: 'boolean', required: false, default: true },
    ],
  },
  {
    id: EditToolType.ADD_FILTER,
    name: 'Add Filter',
    name_ar: 'إضافة فلتر',
    description: 'Apply visual filters',
    description_ar: 'تطبيق فلاتر بصرية',
    icon: 'filter_vintage',
    credits_cost: 1,
    supports_image: true,
    supports_video: true,
    parameters: [
      { name: 'filter', type: 'select', required: true, options: [
        { value: 'vintage', label: 'Vintage', label_ar: 'كلاسيكي' },
        { value: 'warm', label: 'Warm', label_ar: 'دافئ' },
        { value: 'cool', label: 'Cool', label_ar: 'بارد' },
        { value: 'dramatic', label: 'Dramatic', label_ar: 'درامي' },
        { value: 'bright', label: 'Bright', label_ar: 'مشرق' },
      ]},
      { name: 'intensity', type: 'number', required: false, default: 50, min: 0, max: 100 },
    ],
  },
  {
    id: EditToolType.TRIM_VIDEO,
    name: 'Trim Video',
    name_ar: 'قص الفيديو',
    description: 'Cut video to specific duration',
    description_ar: 'قص الفيديو لمدة محددة',
    icon: 'content_cut',
    credits_cost: 1,
    supports_image: false,
    supports_video: true,
    parameters: [
      { name: 'start_time_ms', type: 'number', required: true, min: 0 },
      { name: 'end_time_ms', type: 'number', required: true, min: 0 },
    ],
  },
  {
    id: EditToolType.MERGE_VIDEOS,
    name: 'Merge Videos',
    name_ar: 'دمج الفيديوهات',
    description: 'Combine multiple videos',
    description_ar: 'دمج عدة فيديوهات معاً',
    icon: 'merge',
    credits_cost: 3,
    supports_image: false,
    supports_video: true,
    parameters: [
      { name: 'transition', type: 'select', required: false, default: 'fade', options: [
        { value: 'none', label: 'None', label_ar: 'بدون' },
        { value: 'fade', label: 'Fade', label_ar: 'تلاشي' },
        { value: 'slide', label: 'Slide', label_ar: 'انزلاق' },
        { value: 'zoom', label: 'Zoom', label_ar: 'تكبير' },
      ]},
    ],
  },
  {
    id: EditToolType.ADD_MUSIC,
    name: 'Add Music',
    name_ar: 'إضافة موسيقى',
    description: 'Add background music to video',
    description_ar: 'إضافة موسيقى خلفية للفيديو',
    icon: 'music_note',
    credits_cost: 2,
    supports_image: false,
    supports_video: true,
    parameters: [
      { name: 'music_style', type: 'select', required: false, options: [
        { value: 'upbeat', label: 'Upbeat', label_ar: 'حماسي' },
        { value: 'calm', label: 'Calm', label_ar: 'هادئ' },
        { value: 'corporate', label: 'Corporate', label_ar: 'رسمي' },
        { value: 'epic', label: 'Epic', label_ar: 'ملحمي' },
      ]},
      { name: 'volume', type: 'number', required: false, default: 50, min: 0, max: 100 },
    ],
  },
  {
    id: EditToolType.ADD_SUBTITLES,
    name: 'Add Subtitles',
    name_ar: 'إضافة ترجمة',
    description: 'Add subtitles to video',
    description_ar: 'إضافة ترجمة للفيديو',
    icon: 'subtitles',
    credits_cost: 3,
    supports_image: false,
    supports_video: true,
    parameters: [
      { name: 'auto_generate', type: 'boolean', required: false, default: true },
      { name: 'language', type: 'select', required: false, default: 'ar', options: [
        { value: 'ar', label: 'Arabic', label_ar: 'العربية' },
        { value: 'en', label: 'English', label_ar: 'الإنجليزية' },
      ]},
      { name: 'style', type: 'select', required: false, default: 'default', options: [
        { value: 'default', label: 'Default', label_ar: 'افتراضي' },
        { value: 'minimal', label: 'Minimal', label_ar: 'بسيط' },
        { value: 'bold', label: 'Bold', label_ar: 'عريض' },
        { value: 'animated', label: 'Animated', label_ar: 'متحرك' },
      ]},
    ],
  },
];

export const GENERATE_TOOLS: GenerateToolDefinition[] = [
  {
    id: GenerateToolType.TEMPLATES,
    name: 'Templates',
    name_ar: 'قوالب جاهزة',
    description: 'Ready-to-use design templates',
    description_ar: 'قوالب تصميم جاهزة للاستخدام',
    icon: 'dashboard',
    credits_cost: 0,
    estimated_time_seconds: 5,
    parameters: [],
  },
  {
    id: GenerateToolType.PRODUCT_IMAGES,
    name: 'Product Images',
    name_ar: 'صور المنتجات',
    description: 'Generate professional product photos',
    description_ar: 'توليد صور احترافية للمنتجات',
    icon: 'shopping_bag',
    credits_cost: 3,
    estimated_time_seconds: 30,
    parameters: [
      { name: 'style', type: 'select', required: true, options: [
        { value: 'product_photo', label: 'Product Photo', label_ar: 'صورة منتج' },
        { value: 'lifestyle', label: 'Lifestyle', label_ar: 'لايف ستايل' },
        { value: 'minimal', label: 'Minimal', label_ar: 'بسيط' },
        { value: '3d_render', label: '3D Render', label_ar: 'تصيير 3D' },
        { value: 'flat_lay', label: 'Flat Lay', label_ar: 'فلات لاي' },
      ]},
      { name: 'background', type: 'select', required: false, default: 'white', options: [
        { value: 'white', label: 'White', label_ar: 'أبيض' },
        { value: 'gradient', label: 'Gradient', label_ar: 'تدرج' },
        { value: 'scene', label: 'Scene', label_ar: 'مشهد' },
        { value: 'transparent', label: 'Transparent', label_ar: 'شفاف' },
      ]},
      { name: 'num_images', type: 'number', required: false, default: 4, min: 1, max: 10 },
    ],
  },
  {
    id: GenerateToolType.LANDING_PAGE,
    name: 'Landing Page',
    name_ar: 'صفحة هبوط',
    description: 'Generate product landing page',
    description_ar: 'توليد صفحة هبوط للمنتج',
    icon: 'web',
    credits_cost: 10,
    estimated_time_seconds: 60,
    parameters: [
      { name: 'template_style', type: 'select', required: false, default: 'modern', options: [
        { value: 'modern', label: 'Modern', label_ar: 'عصري' },
        { value: 'minimal', label: 'Minimal', label_ar: 'بسيط' },
        { value: 'bold', label: 'Bold', label_ar: 'جريء' },
        { value: 'elegant', label: 'Elegant', label_ar: 'أنيق' },
      ]},
    ],
  },
  {
    id: GenerateToolType.BANNER,
    name: 'Banner',
    name_ar: 'بانر',
    description: 'Generate promotional banners',
    description_ar: 'توليد بانرات ترويجية',
    icon: 'image',
    credits_cost: 2,
    estimated_time_seconds: 15,
    parameters: [
      { name: 'size', type: 'select', required: true, options: [
        { value: 'web_header', label: 'Web Header (1920x600)', label_ar: 'هيدر ويب' },
        { value: 'web_sidebar', label: 'Sidebar (300x600)', label_ar: 'سايدبار' },
        { value: 'social_post', label: 'Social Post (1080x1080)', label_ar: 'منشور سوشل' },
        { value: 'social_story', label: 'Story (1080x1920)', label_ar: 'ستوري' },
      ]},
      { name: 'background_style', type: 'select', required: false, default: 'gradient', options: [
        { value: 'solid', label: 'Solid Color', label_ar: 'لون واحد' },
        { value: 'gradient', label: 'Gradient', label_ar: 'تدرج' },
        { value: 'image', label: 'Image', label_ar: 'صورة' },
        { value: 'pattern', label: 'Pattern', label_ar: 'نمط' },
      ]},
    ],
  },
  {
    id: GenerateToolType.ANIMATED_IMAGE,
    name: 'Animated Image',
    name_ar: 'صور متحركة',
    description: 'Create animated GIFs and images',
    description_ar: 'إنشاء صور متحركة وGIF',
    icon: 'gif',
    credits_cost: 3,
    estimated_time_seconds: 20,
    parameters: [
      { name: 'animation_type', type: 'select', required: true, options: [
        { value: 'zoom', label: 'Zoom', label_ar: 'تكبير' },
        { value: 'pan', label: 'Pan', label_ar: 'تحريك' },
        { value: 'rotate', label: 'Rotate', label_ar: 'دوران' },
        { value: 'bounce', label: 'Bounce', label_ar: 'ارتداد' },
        { value: 'pulse', label: 'Pulse', label_ar: 'نبض' },
        { value: 'sparkle', label: 'Sparkle', label_ar: 'بريق' },
      ]},
      { name: 'duration_ms', type: 'number', required: false, default: 2000, min: 500, max: 10000 },
      { name: 'output_format', type: 'select', required: false, default: 'gif', options: [
        { value: 'gif', label: 'GIF', label_ar: 'GIF' },
        { value: 'webp', label: 'WebP', label_ar: 'WebP' },
        { value: 'mp4', label: 'MP4', label_ar: 'MP4' },
      ]},
    ],
  },
  {
    id: GenerateToolType.SHORT_VIDEO,
    name: 'Short Video',
    name_ar: 'فيديو قصير',
    description: 'Generate short product videos',
    description_ar: 'توليد فيديوهات قصيرة للمنتجات',
    icon: 'videocam',
    credits_cost: 8,
    estimated_time_seconds: 45,
    parameters: [
      { name: 'video_type', type: 'select', required: true, options: [
        { value: 'product_showcase', label: 'Product Showcase', label_ar: 'عرض المنتج' },
        { value: 'promo', label: 'Promo', label_ar: 'ترويجي' },
        { value: 'unboxing', label: 'Unboxing', label_ar: 'فتح صندوق' },
      ]},
      { name: 'duration_seconds', type: 'select', required: true, options: [
        { value: '15', label: '15 seconds', label_ar: '15 ثانية' },
        { value: '30', label: '30 seconds', label_ar: '30 ثانية' },
        { value: '60', label: '60 seconds', label_ar: '60 ثانية' },
      ]},
      { name: 'aspect_ratio', type: 'select', required: true, options: [
        { value: '9:16', label: 'Portrait (9:16)', label_ar: 'عمودي' },
        { value: '16:9', label: 'Landscape (16:9)', label_ar: 'أفقي' },
        { value: '1:1', label: 'Square (1:1)', label_ar: 'مربع' },
      ]},
      { name: 'include_music', type: 'boolean', required: false, default: true },
      { name: 'include_voiceover', type: 'boolean', required: false, default: false },
    ],
  },
  {
    id: GenerateToolType.LOGO,
    name: 'Logo',
    name_ar: 'شعار',
    description: 'Generate brand logos',
    description_ar: 'توليد شعارات للعلامة التجارية',
    icon: 'star',
    credits_cost: 5,
    estimated_time_seconds: 25,
    parameters: [
      { name: 'style', type: 'select', required: true, options: [
        { value: 'modern', label: 'Modern', label_ar: 'عصري' },
        { value: 'classic', label: 'Classic', label_ar: 'كلاسيكي' },
        { value: 'playful', label: 'Playful', label_ar: 'مرح' },
        { value: 'minimal', label: 'Minimal', label_ar: 'بسيط' },
        { value: 'geometric', label: 'Geometric', label_ar: 'هندسي' },
      ]},
      { name: 'include_icon', type: 'boolean', required: false, default: true },
      { name: 'include_text', type: 'boolean', required: false, default: true },
      { name: 'num_variations', type: 'number', required: false, default: 4, min: 1, max: 10 },
    ],
  },
];
