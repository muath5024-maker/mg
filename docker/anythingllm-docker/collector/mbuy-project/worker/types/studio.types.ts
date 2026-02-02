/**
 * Studio Types - تعريفات TypeScript للاستوديو
 */

// =====================================================
// Enums
// =====================================================

export enum ProjectStatus {
  DRAFT = 'draft',
  GENERATING = 'generating',
  PROCESSING = 'processing',
  READY = 'ready',
  FAILED = 'failed',
}

export enum SceneType {
  INTRO = 'intro',
  IMAGE = 'image',
  VIDEO = 'video',
  UGC = 'ugc',
  TEXT = 'text',
  TRANSITION = 'transition',
  CTA = 'cta',
}

export enum SceneStatus {
  PENDING = 'pending',
  GENERATING = 'generating',
  READY = 'ready',
  FAILED = 'failed',
}

export enum AssetType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  FONT = 'font',
  LOGO = 'logo',
}

export enum AssetSource {
  UPLOADED = 'uploaded',
  AI_GENERATED = 'ai_generated',
  TEMPLATE = 'template',
  PRODUCT = 'product',
}

export enum RenderStatus {
  QUEUED = 'queued',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum TemplateCategory {
  PRODUCT_AD = 'product_ad',
  UGC = 'ugc',
  PROMO = 'promo',
  STORY = 'story',
}

export enum AspectRatio {
  PORTRAIT = '9:16',
  LANDSCAPE = '16:9',
  SQUARE = '1:1',
}

// =====================================================
// Database Models
// =====================================================

export interface UserCredits {
  id: string;
  user_id: string;
  store_id?: string;
  balance: number;
  total_earned: number;
  total_spent: number;
  last_free_refill?: string;
  created_at: string;
  updated_at: string;
}

export interface StudioTemplate {
  id: string;
  name: string;
  name_ar?: string;
  description?: string;
  description_ar?: string;
  category: TemplateCategory;
  thumbnail_url?: string;
  preview_video_url?: string;
  scenes_config: SceneConfig[];
  duration_seconds: number;
  aspect_ratio: AspectRatio;
  is_premium: boolean;
  is_active: boolean;
  usage_count: number;
  credits_cost: number;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface StudioProject {
  id: string;
  user_id: string;
  store_id?: string;
  template_id?: string;
  product_id?: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  product_data: ProductData;
  script_data: ScriptData;
  settings: ProjectSettings;
  output_url?: string;
  output_thumbnail_url?: string;
  output_duration?: number;
  output_size_bytes?: number;
  credits_used: number;
  error_message?: string;
  progress: number;
  created_at: string;
  updated_at: string;
}

export interface StudioScene {
  id: string;
  project_id: string;
  order_index: number;
  scene_type: SceneType;
  prompt?: string;
  script_text?: string;
  duration_ms: number;
  generated_image_url?: string;
  generated_video_url?: string;
  generated_audio_url?: string;
  status: SceneStatus;
  error_message?: string;
  layers: Layer[];
  transition_in: string;
  transition_out: string;
  created_at: string;
  updated_at: string;
}

export interface StudioAsset {
  id: string;
  project_id?: string;
  user_id: string;
  store_id?: string;
  name?: string;
  asset_type: AssetType;
  source: AssetSource;
  url: string;
  thumbnail_url?: string;
  file_size_bytes?: number;
  mime_type?: string;
  duration_ms?: number;
  width?: number;
  height?: number;
  metadata: Record<string, unknown>;
  ai_prompt?: string;
  ai_model?: string;
  ai_cost_credits?: number;
  is_favorite: boolean;
  usage_count: number;
  created_at: string;
}

export interface StudioRender {
  id: string;
  project_id: string;
  user_id: string;
  status: RenderStatus;
  progress: number;
  format: string;
  resolution: string;
  quality: string;
  output_url?: string;
  output_size_bytes?: number;
  render_time_seconds?: number;
  credits_cost: number;
  error_message?: string;
  error_code?: string;
  retry_count: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

// =====================================================
// Nested Types
// =====================================================

export interface SceneConfig {
  type: SceneType;
  duration: number;
  prompt: string;
}

export interface ProductData {
  name?: string;
  name_ar?: string;
  description?: string;
  description_ar?: string;
  price?: number;
  currency?: string;
  images?: string[];
  features?: string[];
}

export interface ScriptData {
  title?: string;
  hook?: string;
  scenes?: GeneratedScene[];
  cta?: string;
  language?: string;
}

export interface GeneratedScene {
  index: number;
  type: SceneType;
  visual_prompt: string;
  narration?: string;
  text_overlay?: string;
  duration_ms: number;
}

export interface ProjectSettings {
  aspect_ratio: AspectRatio;
  duration: number;
  language: string;
  voice_id?: string;
  music_id?: string;
  logo_url?: string;
  brand_color: string;
}

export interface Layer {
  id: string;
  type: 'text' | 'image' | 'logo' | 'shape';
  content: string;
  position: Position;
  size: Size;
  style: LayerStyle;
  animation?: Animation;
}

export interface Position {
  x: number;
  y: number;
  rotation: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface LayerStyle {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  backgroundColor?: string;
  opacity?: number;
  borderRadius?: number;
  shadow?: Shadow;
}

export interface Shadow {
  offsetX: number;
  offsetY: number;
  blur: number;
  color: string;
}

export interface Animation {
  type: 'fade' | 'slide' | 'zoom' | 'bounce';
  direction?: 'in' | 'out' | 'left' | 'right' | 'up' | 'down';
  duration: number;
  delay: number;
}

// =====================================================
// API Request/Response Types
// =====================================================

// Generate Script
export interface GenerateScriptRequest {
  product_data: ProductData;
  template_id?: string;
  language?: string;
  tone?: 'professional' | 'casual' | 'energetic' | 'luxury';
  duration_seconds?: number;
}

export interface GenerateScriptResponse {
  success: boolean;
  script: ScriptData;
  credits_used: number;
}

// Generate Image
export interface GenerateImageRequest {
  prompt: string;
  style?: 'realistic' | 'illustration' | 'minimal' | '3d';
  aspect_ratio?: AspectRatio;
  project_id?: string;
}

export interface GenerateImageResponse {
  success: boolean;
  image_url: string;
  thumbnail_url?: string;
  credits_used: number;
}

// Generate Voice
export interface GenerateVoiceRequest {
  text: string;
  voice_id?: string;
  language?: string;
  speed?: number;
  project_id?: string;
}

export interface GenerateVoiceResponse {
  success: boolean;
  audio_url: string;
  duration_ms: number;
  credits_used: number;
}

// Generate UGC Video
export interface GenerateUGCRequest {
  script: string;
  avatar_id?: string;
  voice_id?: string;
  background?: string;
  project_id?: string;
}

export interface GenerateUGCResponse {
  success: boolean;
  video_url: string;
  thumbnail_url?: string;
  duration_ms: number;
  credits_used: number;
}

// Start Render
export interface StartRenderRequest {
  project_id: string;
  resolution?: '720p' | '1080p' | '4k';
  quality?: 'low' | 'medium' | 'high';
  format?: 'mp4' | 'webm';
}

export interface StartRenderResponse {
  success: boolean;
  render_id: string;
  estimated_time_seconds: number;
  credits_cost: number;
}

// Render Status
export interface RenderStatusResponse {
  render_id: string;
  status: RenderStatus;
  progress: number;
  output_url?: string;
  error_message?: string;
}

// Create Project
export interface CreateProjectRequest {
  name: string;
  template_id?: string;
  product_id?: string;
  product_data?: ProductData;
}

export interface CreateProjectResponse {
  success: boolean;
  project: StudioProject;
}

// Update Project
export interface UpdateProjectRequest {
  name?: string;
  settings?: Partial<ProjectSettings>;
  script_data?: Partial<ScriptData>;
}

// =====================================================
// AI Provider Types
// =====================================================

// OpenRouter
export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  max_tokens?: number;
  temperature?: number;
}

export interface OpenRouterResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Fal.ai
export interface FalImageRequest {
  prompt: string;
  negative_prompt?: string;
  image_size?: {
    width: number;
    height: number;
  };
  num_images?: number;
  seed?: number;
}

export interface FalImageResponse {
  images: Array<{
    url: string;
    width: number;
    height: number;
  }>;
  seed: number;
}

// ElevenLabs
export interface ElevenLabsRequest {
  text: string;
  model_id?: string;
  voice_settings?: {
    stability: number;
    similarity_boost: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
}

// D-ID
export interface DIDRequest {
  script: {
    type: 'text';
    input: string;
    provider?: {
      type: 'elevenlabs';
      voice_id: string;
    };
  };
  source_url: string;
  config?: {
    stitch?: boolean;
  };
}

export interface DIDResponse {
  id: string;
  status: string;
  result_url?: string;
}

// =====================================================
// Webhook Types
// =====================================================

export interface WebhookPayload {
  event: 'render.completed' | 'render.failed' | 'generation.completed';
  project_id: string;
  render_id?: string;
  data: Record<string, unknown>;
  timestamp: string;
}

// =====================================================
// Error Types
// =====================================================

export interface StudioError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export const StudioErrorCodes = {
  INSUFFICIENT_CREDITS: 'INSUFFICIENT_CREDITS',
  PROJECT_NOT_FOUND: 'PROJECT_NOT_FOUND',
  TEMPLATE_NOT_FOUND: 'TEMPLATE_NOT_FOUND',
  GENERATION_FAILED: 'GENERATION_FAILED',
  RENDER_FAILED: 'RENDER_FAILED',
  INVALID_REQUEST: 'INVALID_REQUEST',
  RATE_LIMITED: 'RATE_LIMITED',
  API_ERROR: 'API_ERROR',
} as const;
