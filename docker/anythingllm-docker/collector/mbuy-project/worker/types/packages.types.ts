/**
 * Package Types - تعريفات حزم التوفير
 */

// =====================================================
// Package Enums
// =====================================================

export enum PackageType {
  MOTION_GRAPHICS = 'motion_graphics',
  VLOG = 'vlog',
  AD_CAMPAIGN = 'ad_campaign',
  UGC_VIDEO = 'ugc_video',
  SOCIAL_ADS = 'social_ads',
  BRAND_IDENTITY = 'brand_identity',
}

export enum PackageStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum DeliveryFormat {
  MP4 = 'mp4',
  MOV = 'mov',
  GIF = 'gif',
  PNG = 'png',
  JPG = 'jpg',
  SVG = 'svg',
  PDF = 'pdf',
}

// =====================================================
// Package Definitions
// =====================================================

export interface PackageDefinition {
  id: PackageType;
  name: string;
  name_ar: string;
  description: string;
  description_ar: string;
  icon: string;
  credits_cost: number;
  estimated_time_minutes: number;
  deliverables: PackageDeliverable[];
  features: string[];
  features_ar: string[];
  is_premium: boolean;
  is_popular: boolean;
}

export interface PackageDeliverable {
  type: string;
  format: DeliveryFormat;
  quantity: number;
  description: string;
  description_ar: string;
}

// =====================================================
// Package Order
// =====================================================

export interface PackageOrder {
  id: string;
  user_id: string;
  store_id: string;
  package_type: PackageType;
  status: PackageStatus;
  
  // Input data
  product_id?: string;
  product_data: ProductInputData;
  brand_data?: BrandInputData;
  preferences: PackagePreferences;
  
  // Output
  deliverables: PackageDeliverableResult[];
  
  // Tracking
  progress: number;
  current_step: string;
  error_message?: string;
  
  // Credits
  credits_cost: number;
  credits_refunded?: number;
  
  // Timestamps
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductInputData {
  name: string;
  name_ar?: string;
  description?: string;
  description_ar?: string;
  price?: number;
  currency?: string;
  category?: string;
  images: string[];
  features?: string[];
  target_audience?: string;
  unique_selling_points?: string[];
}

export interface BrandInputData {
  store_name: string;
  store_name_ar?: string;
  tagline?: string;
  tagline_ar?: string;
  primary_color?: string;
  secondary_color?: string;
  existing_logo_url?: string;
  industry?: string;
  style_preferences?: string[];
}

export interface PackagePreferences {
  language: 'ar' | 'en' | 'both';
  tone?: 'professional' | 'casual' | 'energetic' | 'luxury' | 'friendly';
  duration_seconds?: number;
  aspect_ratio?: '9:16' | '16:9' | '1:1';
  platforms?: ('instagram' | 'tiktok' | 'snapchat' | 'facebook' | 'twitter' | 'youtube')[];
  music_style?: string;
  voice_gender?: 'male' | 'female';
  include_subtitles?: boolean;
  custom_instructions?: string;
}

export interface PackageDeliverableResult {
  id: string;
  type: string;
  format: DeliveryFormat;
  url: string;
  thumbnail_url?: string;
  file_size_bytes?: number;
  duration_ms?: number;
  width?: number;
  height?: number;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// =====================================================
// API Request/Response Types
// =====================================================

export interface CreatePackageOrderRequest {
  package_type: PackageType;
  product_id?: string;
  product_data?: ProductInputData;
  brand_data?: BrandInputData;
  preferences: PackagePreferences;
}

export interface CreatePackageOrderResponse {
  success: boolean;
  order: PackageOrder;
  estimated_time_minutes: number;
  credits_charged: number;
}

export interface GetPackageStatusResponse {
  success: boolean;
  order: PackageOrder;
  deliverables: PackageDeliverableResult[];
}

// =====================================================
// Package Configurations (Static)
// =====================================================

export const PACKAGE_DEFINITIONS: PackageDefinition[] = [
  {
    id: PackageType.MOTION_GRAPHICS,
    name: 'Motion Graphics',
    name_ar: 'موشن جرافيك',
    description: 'Professional animated video for your product',
    description_ar: 'فيديو متحرك احترافي لمنتجك',
    icon: 'movie_filter',
    credits_cost: 50,
    estimated_time_minutes: 15,
    deliverables: [
      { type: 'video', format: DeliveryFormat.MP4, quantity: 1, description: '30s Motion Graphics Video', description_ar: 'فيديو موشن جرافيك 30 ثانية' },
      { type: 'video', format: DeliveryFormat.MP4, quantity: 1, description: '15s Short Version', description_ar: 'نسخة قصيرة 15 ثانية' },
      { type: 'image', format: DeliveryFormat.PNG, quantity: 3, description: 'Key Frames', description_ar: 'صور رئيسية' },
    ],
    features: ['AI-generated script', 'Professional animations', 'Background music', 'Multiple formats'],
    features_ar: ['سيناريو بالذكاء الاصطناعي', 'رسوم متحركة احترافية', 'موسيقى خلفية', 'صيغ متعددة'],
    is_premium: false,
    is_popular: true,
  },
  {
    id: PackageType.VLOG,
    name: 'Vlog Video',
    name_ar: 'فلوق فيديو',
    description: 'AI presenter talking about your product',
    description_ar: 'مقدم ذكاء اصطناعي يتحدث عن منتجك',
    icon: 'person_play',
    credits_cost: 80,
    estimated_time_minutes: 20,
    deliverables: [
      { type: 'video', format: DeliveryFormat.MP4, quantity: 1, description: '1-2 min Vlog Video', description_ar: 'فيديو فلوق 1-2 دقيقة' },
      { type: 'video', format: DeliveryFormat.MP4, quantity: 1, description: '30s Teaser', description_ar: 'تيزر 30 ثانية' },
    ],
    features: ['AI Avatar presenter', 'Natural voice', 'Product showcase', 'Engaging script'],
    features_ar: ['مقدم أفاتار ذكي', 'صوت طبيعي', 'عرض المنتج', 'سيناريو جذاب'],
    is_premium: true,
    is_popular: false,
  },
  {
    id: PackageType.AD_CAMPAIGN,
    name: 'Ad Campaign',
    name_ar: 'حملة إعلانية',
    description: 'Complete ad package for all platforms',
    description_ar: 'حزمة إعلانية كاملة لجميع المنصات',
    icon: 'campaign',
    credits_cost: 100,
    estimated_time_minutes: 25,
    deliverables: [
      { type: 'video', format: DeliveryFormat.MP4, quantity: 3, description: 'Ad Videos (15s, 30s, 60s)', description_ar: 'فيديوهات إعلانية (15، 30، 60 ثانية)' },
      { type: 'image', format: DeliveryFormat.PNG, quantity: 5, description: 'Static Ad Images', description_ar: 'صور إعلانية ثابتة' },
      { type: 'text', format: DeliveryFormat.PDF, quantity: 1, description: 'Ad Copy Document', description_ar: 'نصوص إعلانية' },
    ],
    features: ['Multi-platform formats', 'A/B variations', 'Ad copy included', 'Optimized for conversions'],
    features_ar: ['صيغ لجميع المنصات', 'نسخ A/B', 'نصوص إعلانية جاهزة', 'محسّن للتحويلات'],
    is_premium: false,
    is_popular: true,
  },
  {
    id: PackageType.UGC_VIDEO,
    name: 'UGC Video',
    name_ar: 'فيديو UGC',
    description: 'User-generated content style review video',
    description_ar: 'فيديو مراجعة بأسلوب المحتوى المُنشأ من المستخدمين',
    icon: 'video_camera_front',
    credits_cost: 70,
    estimated_time_minutes: 18,
    deliverables: [
      { type: 'video', format: DeliveryFormat.MP4, quantity: 1, description: '30-60s UGC Review', description_ar: 'مراجعة UGC 30-60 ثانية' },
      { type: 'video', format: DeliveryFormat.MP4, quantity: 1, description: '15s Hook Version', description_ar: 'نسخة Hook 15 ثانية' },
    ],
    features: ['Realistic AI presenter', 'Authentic style', 'Product unboxing', 'Call to action'],
    features_ar: ['مقدم واقعي بالذكاء الاصطناعي', 'أسلوب أصيل', 'فتح صندوق المنتج', 'دعوة للإجراء'],
    is_premium: true,
    is_popular: true,
  },
  {
    id: PackageType.SOCIAL_ADS,
    name: 'Social Media Ads',
    name_ar: 'إعلانات سوشل ميديا',
    description: 'Ready-to-post content for all platforms',
    description_ar: 'محتوى جاهز للنشر على جميع المنصات',
    icon: 'share',
    credits_cost: 40,
    estimated_time_minutes: 10,
    deliverables: [
      { type: 'image', format: DeliveryFormat.PNG, quantity: 10, description: 'Social Media Posts', description_ar: 'منشورات سوشل ميديا' },
      { type: 'video', format: DeliveryFormat.MP4, quantity: 3, description: 'Story/Reel Videos', description_ar: 'فيديوهات ستوري/ريلز' },
      { type: 'image', format: DeliveryFormat.GIF, quantity: 2, description: 'Animated Posts', description_ar: 'منشورات متحركة' },
    ],
    features: ['All platform sizes', 'Carousel posts', 'Stories & Reels', 'Captions included'],
    features_ar: ['جميع أحجام المنصات', 'منشورات كاروسيل', 'ستوريز وريلز', 'نصوص جاهزة'],
    is_premium: false,
    is_popular: false,
  },
  {
    id: PackageType.BRAND_IDENTITY,
    name: 'Brand Identity',
    name_ar: 'هوية بصرية',
    description: 'Complete visual identity for your store',
    description_ar: 'هوية بصرية كاملة لمتجرك',
    icon: 'palette',
    credits_cost: 150,
    estimated_time_minutes: 30,
    deliverables: [
      { type: 'logo', format: DeliveryFormat.SVG, quantity: 1, description: 'Primary Logo', description_ar: 'الشعار الرئيسي' },
      { type: 'logo', format: DeliveryFormat.PNG, quantity: 3, description: 'Logo Variations', description_ar: 'تنويعات الشعار' },
      { type: 'image', format: DeliveryFormat.PNG, quantity: 5, description: 'Social Media Kit', description_ar: 'حزمة سوشل ميديا' },
      { type: 'image', format: DeliveryFormat.PNG, quantity: 3, description: 'Store Banners', description_ar: 'بانرات المتجر' },
      { type: 'document', format: DeliveryFormat.PDF, quantity: 1, description: 'Brand Guidelines', description_ar: 'دليل الهوية البصرية' },
    ],
    features: ['Logo design', 'Color palette', 'Typography', 'Social templates', 'Brand guidelines'],
    features_ar: ['تصميم الشعار', 'لوحة الألوان', 'الخطوط', 'قوالب سوشل ميديا', 'دليل الهوية'],
    is_premium: true,
    is_popular: true,
  },
];
