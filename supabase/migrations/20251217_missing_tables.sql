-- ============================================================================
-- Migration: إنشاء الجداول الناقصة
-- Date: 2025-12-17
-- Purpose: إضافة جميع الجداول المطلوبة للميزات الجديدة
-- ============================================================================

-- ============================================================================
-- PART 1: جداول التقارير التلقائية (Auto Reports)
-- ============================================================================

-- إعدادات التقارير
CREATE TABLE IF NOT EXISTS public.report_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('daily', 'weekly', 'monthly', 'custom')),
  is_enabled BOOLEAN DEFAULT true,
  email_recipients TEXT[],
  schedule_time TIME DEFAULT '08:00:00',
  schedule_day INTEGER, -- 0-6 للأسبوعي، 1-31 للشهري
  include_sections JSONB DEFAULT '["sales", "orders", "products", "customers"]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, report_type)
);

-- التقارير المُنشأة
CREATE TABLE IF NOT EXISTS public.generated_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL,
  title TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  data JSONB NOT NULL,
  file_url TEXT,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- قوالب التقارير
CREATE TABLE IF NOT EXISTS public.report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE, -- NULL = قالب عام
  name TEXT NOT NULL,
  description TEXT,
  template_config JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدولة التقارير
CREATE TABLE IF NOT EXISTS public.report_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.report_templates(id) ON DELETE SET NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  next_run_at TIMESTAMPTZ NOT NULL,
  last_run_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PART 2: جداول خريطة الحرارة (Heatmap)
-- ============================================================================

-- إعدادات خريطة الحرارة
CREATE TABLE IF NOT EXISTS public.heatmap_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE UNIQUE,
  is_enabled BOOLEAN DEFAULT true,
  track_clicks BOOLEAN DEFAULT true,
  track_scroll BOOLEAN DEFAULT true,
  track_movement BOOLEAN DEFAULT false,
  sample_rate INTEGER DEFAULT 100, -- نسبة العينة %
  retention_days INTEGER DEFAULT 30,
  excluded_pages TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- أحداث خريطة الحرارة
CREATE TABLE IF NOT EXISTS public.heatmap_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  page_url TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('click', 'scroll', 'movement', 'rage_click')),
  x_position INTEGER NOT NULL,
  y_position INTEGER NOT NULL,
  viewport_width INTEGER,
  viewport_height INTEGER,
  element_selector TEXT,
  element_text TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ملخص صفحات الحرارة
CREATE TABLE IF NOT EXISTS public.heatmap_page_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  page_url TEXT NOT NULL,
  total_visits INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  avg_scroll_depth DECIMAL(5,2) DEFAULT 0,
  avg_time_on_page INTEGER DEFAULT 0, -- بالثواني
  bounce_rate DECIMAL(5,2) DEFAULT 0,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, page_url, date)
);

-- تسجيلات الجلسات
CREATE TABLE IF NOT EXISTS public.session_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL UNIQUE,
  visitor_id TEXT,
  page_url TEXT NOT NULL,
  duration INTEGER DEFAULT 0, -- بالثواني
  events_count INTEGER DEFAULT 0,
  recording_url TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  country TEXT,
  city TEXT,
  is_processed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PART 3: جداول المساعد الذكي (AI Assistant)
-- ============================================================================

-- إعدادات المساعد الذكي
CREATE TABLE IF NOT EXISTS public.ai_assistant_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE UNIQUE,
  is_enabled BOOLEAN DEFAULT true,
  persona TEXT DEFAULT 'professional',
  language TEXT DEFAULT 'ar',
  response_style TEXT DEFAULT 'balanced',
  max_tokens INTEGER DEFAULT 1000,
  temperature DECIMAL(2,1) DEFAULT 0.7,
  welcome_message TEXT,
  custom_instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- محادثات AI
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  title TEXT,
  context TEXT,
  is_active BOOLEAN DEFAULT true,
  messages_count INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- رسائل AI
CREATE TABLE IF NOT EXISTS public.ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  model TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- سجل استخدام AI
CREATE TABLE IF NOT EXISTS public.ai_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  feature TEXT NOT NULL,
  tokens_input INTEGER DEFAULT 0,
  tokens_output INTEGER DEFAULT 0,
  cost DECIMAL(10,6) DEFAULT 0,
  model TEXT,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- أوامر AI السريعة
CREATE TABLE IF NOT EXISTS public.ai_quick_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE, -- NULL = عام
  name TEXT NOT NULL,
  description TEXT,
  prompt_template TEXT NOT NULL,
  category TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- اقتراحات AI
CREATE TABLE IF NOT EXISTS public.ai_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  suggestion_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority INTEGER DEFAULT 0,
  is_dismissed BOOLEAN DEFAULT false,
  is_applied BOOLEAN DEFAULT false,
  metadata JSONB,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PART 4: جداول مولد المحتوى (Content Generator)
-- ============================================================================

-- قوالب المحتوى
CREATE TABLE IF NOT EXISTS public.content_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE, -- NULL = عام
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  prompt_template TEXT NOT NULL,
  variables JSONB,
  example_output TEXT,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- إعدادات المحتوى
CREATE TABLE IF NOT EXISTS public.content_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE UNIQUE,
  brand_voice TEXT,
  target_audience TEXT,
  tone TEXT DEFAULT 'professional',
  language TEXT DEFAULT 'ar',
  keywords TEXT[],
  avoid_words TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- المحتوى المُنشأ
CREATE TABLE IF NOT EXISTS public.generated_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.content_templates(id) ON DELETE SET NULL,
  content_type TEXT NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  input_data JSONB,
  tokens_used INTEGER DEFAULT 0,
  is_saved BOOLEAN DEFAULT false,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- مكتبة المحتوى
CREATE TABLE IF NOT EXISTS public.content_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  content_id UUID REFERENCES public.generated_content(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT NOT NULL,
  tags TEXT[],
  is_favorite BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PART 5: جداول التسعير الذكي (Smart Pricing)
-- ============================================================================

-- إعدادات التسعير
CREATE TABLE IF NOT EXISTS public.pricing_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE UNIQUE,
  is_enabled BOOLEAN DEFAULT false,
  auto_adjust BOOLEAN DEFAULT false,
  min_margin DECIMAL(5,2) DEFAULT 10,
  max_discount DECIMAL(5,2) DEFAULT 30,
  competitor_tracking BOOLEAN DEFAULT false,
  demand_based BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- قواعد التسعير
CREATE TABLE IF NOT EXISTS public.pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('discount', 'markup', 'competitor', 'demand', 'time_based')),
  conditions JSONB NOT NULL,
  actions JSONB NOT NULL,
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- أسعار المنافسين
CREATE TABLE IF NOT EXISTS public.competitor_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  competitor_name TEXT NOT NULL,
  competitor_url TEXT,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'SAR',
  last_checked_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- تنبيهات الأسعار
CREATE TABLE IF NOT EXISTS public.price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('competitor_lower', 'margin_low', 'demand_high', 'price_drop')),
  message TEXT NOT NULL,
  suggested_price DECIMAL(10,2),
  current_price DECIMAL(10,2),
  is_read BOOLEAN DEFAULT false,
  is_applied BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- تاريخ الأسعار
CREATE TABLE IF NOT EXISTS public.price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  old_price DECIMAL(10,2) NOT NULL,
  new_price DECIMAL(10,2) NOT NULL,
  change_reason TEXT,
  changed_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- اقتراحات الأسعار
CREATE TABLE IF NOT EXISTS public.price_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  current_price DECIMAL(10,2) NOT NULL,
  suggested_price DECIMAL(10,2) NOT NULL,
  reason TEXT NOT NULL,
  confidence DECIMAL(3,2), -- 0-1
  potential_impact JSONB,
  is_applied BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PART 6: جداول شرائح العملاء (Customer Segments)
-- ============================================================================

-- شرائح العملاء
CREATE TABLE IF NOT EXISTS public.customer_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  segment_type TEXT DEFAULT 'custom' CHECK (segment_type IN ('ai_generated', 'custom', 'rfm', 'behavior')),
  conditions JSONB NOT NULL,
  color TEXT,
  icon TEXT,
  customers_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  auto_update BOOLEAN DEFAULT true,
  last_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- عملاء الشرائح
CREATE TABLE IF NOT EXISTS public.segment_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id UUID NOT NULL REFERENCES public.customer_segments(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL,
  score DECIMAL(5,2),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(segment_id, customer_id)
);

-- علامات العملاء
CREATE TABLE IF NOT EXISTS public.customer_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366F1',
  description TEXT,
  auto_apply_rules JSONB,
  customers_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, name)
);

-- تحليلات العملاء
CREATE TABLE IF NOT EXISTS public.customer_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL,
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(12,2) DEFAULT 0,
  avg_order_value DECIMAL(10,2) DEFAULT 0,
  first_order_date DATE,
  last_order_date DATE,
  days_since_last_order INTEGER,
  order_frequency DECIMAL(5,2), -- طلبات في الشهر
  rfm_recency INTEGER, -- 1-5
  rfm_frequency INTEGER, -- 1-5
  rfm_monetary INTEGER, -- 1-5
  rfm_score INTEGER, -- مجموع
  lifetime_value DECIMAL(12,2) DEFAULT 0,
  churn_risk DECIMAL(3,2), -- 0-1
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, customer_id)
);

-- تعيينات العلامات
CREATE TABLE IF NOT EXISTS public.customer_tag_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id UUID NOT NULL REFERENCES public.customer_tags(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  UNIQUE(tag_id, customer_id)
);

-- حملات الشرائح
CREATE TABLE IF NOT EXISTS public.segment_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  segment_id UUID NOT NULL REFERENCES public.customer_segments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  campaign_type TEXT NOT NULL,
  content JSONB NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'completed')),
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  stats JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PART 7: جداول الرسائل المخصصة (Custom Messages)
-- ============================================================================

-- قوالب الرسائل
CREATE TABLE IF NOT EXISTS public.message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'email', 'whatsapp', 'push')),
  subject TEXT,
  content TEXT NOT NULL,
  variables TEXT[],
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- حملات الرسائل
CREATE TABLE IF NOT EXISTS public.message_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  template_id UUID REFERENCES public.message_templates(id) ON DELETE SET NULL,
  segment_id UUID REFERENCES public.customer_segments(id) ON DELETE SET NULL,
  channel TEXT NOT NULL,
  content JSONB NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  recipients_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- قائمة الرسائل
CREATE TABLE IF NOT EXISTS public.message_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.message_campaigns(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  recipient_id UUID,
  recipient_contact TEXT NOT NULL,
  channel TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'delivered', 'failed')),
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- سجل الرسائل
CREATE TABLE IF NOT EXISTS public.message_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_id UUID,
  channel TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  content TEXT NOT NULL,
  status TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- الرسائل التلقائية
CREATE TABLE IF NOT EXISTS public.automated_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('order_placed', 'order_shipped', 'order_delivered', 'cart_abandoned', 'birthday', 'anniversary', 'inactive')),
  template_id UUID REFERENCES public.message_templates(id) ON DELETE SET NULL,
  channel TEXT NOT NULL,
  delay_minutes INTEGER DEFAULT 0,
  conditions JSONB,
  is_active BOOLEAN DEFAULT true,
  sent_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- إعدادات الرسائل
CREATE TABLE IF NOT EXISTS public.message_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE UNIQUE,
  sms_enabled BOOLEAN DEFAULT false,
  sms_provider TEXT,
  sms_api_key TEXT,
  email_enabled BOOLEAN DEFAULT true,
  email_from_name TEXT,
  email_from_address TEXT,
  whatsapp_enabled BOOLEAN DEFAULT false,
  push_enabled BOOLEAN DEFAULT true,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  daily_limit INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PART 8: جداول برنامج الولاء (Loyalty Program)
-- ============================================================================

-- برامج الولاء
CREATE TABLE IF NOT EXISTS public.loyalty_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  points_per_currency DECIMAL(5,2) DEFAULT 1, -- نقاط لكل ريال
  currency_per_point DECIMAL(5,2) DEFAULT 0.1, -- قيمة كل نقطة
  min_redemption_points INTEGER DEFAULT 100,
  expiry_months INTEGER, -- NULL = لا تنتهي
  welcome_bonus INTEGER DEFAULT 0,
  birthday_bonus INTEGER DEFAULT 0,
  referral_bonus INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- مستويات الولاء
CREATE TABLE IF NOT EXISTS public.loyalty_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES public.loyalty_programs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  min_points INTEGER NOT NULL,
  multiplier DECIMAL(3,1) DEFAULT 1, -- مضاعف النقاط
  benefits JSONB,
  color TEXT,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- أعضاء الولاء
CREATE TABLE IF NOT EXISTS public.loyalty_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES public.loyalty_programs(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL,
  current_points INTEGER DEFAULT 0,
  lifetime_points INTEGER DEFAULT 0,
  tier_id UUID REFERENCES public.loyalty_tiers(id) ON DELETE SET NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ,
  points_expiring_soon INTEGER DEFAULT 0,
  next_expiry_date DATE,
  UNIQUE(program_id, customer_id)
);

-- معاملات نقاط الولاء
CREATE TABLE IF NOT EXISTS public.loyalty_points_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.loyalty_members(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earn', 'redeem', 'expire', 'adjust', 'bonus')),
  points INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  description TEXT,
  reference_type TEXT,
  reference_id UUID,
  expires_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- مكافآت الولاء
CREATE TABLE IF NOT EXISTS public.loyalty_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES public.loyalty_programs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('discount', 'free_product', 'free_shipping', 'gift_card', 'custom')),
  points_required INTEGER NOT NULL,
  value DECIMAL(10,2),
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  max_redemptions INTEGER,
  current_redemptions INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- استبدالات الولاء
CREATE TABLE IF NOT EXISTS public.loyalty_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.loyalty_members(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES public.loyalty_rewards(id) ON DELETE CASCADE,
  points_used INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'fulfilled', 'cancelled')),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  coupon_code TEXT,
  fulfilled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PART 9: الفهارس (Indexes)
-- ============================================================================

-- فهارس التقارير
CREATE INDEX IF NOT EXISTS idx_report_settings_store ON public.report_settings(store_id);
CREATE INDEX IF NOT EXISTS idx_generated_reports_store ON public.generated_reports(store_id);
CREATE INDEX IF NOT EXISTS idx_generated_reports_date ON public.generated_reports(period_start, period_end);

-- فهارس خريطة الحرارة
CREATE INDEX IF NOT EXISTS idx_heatmap_events_store ON public.heatmap_events(store_id);
CREATE INDEX IF NOT EXISTS idx_heatmap_events_session ON public.heatmap_events(session_id);
CREATE INDEX IF NOT EXISTS idx_heatmap_events_created ON public.heatmap_events(created_at);
CREATE INDEX IF NOT EXISTS idx_session_recordings_store ON public.session_recordings(store_id);

-- فهارس AI
CREATE INDEX IF NOT EXISTS idx_ai_conversations_store ON public.ai_conversations(store_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation ON public.ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_store ON public.ai_usage_log(store_id);

-- فهارس المحتوى
CREATE INDEX IF NOT EXISTS idx_content_templates_store ON public.content_templates(store_id);
CREATE INDEX IF NOT EXISTS idx_generated_content_store ON public.generated_content(store_id);
CREATE INDEX IF NOT EXISTS idx_content_library_store ON public.content_library(store_id);

-- فهارس التسعير
CREATE INDEX IF NOT EXISTS idx_pricing_rules_store ON public.pricing_rules(store_id);
CREATE INDEX IF NOT EXISTS idx_competitor_prices_product ON public.competitor_prices(product_id);
CREATE INDEX IF NOT EXISTS idx_price_history_product ON public.price_history(product_id);

-- فهارس شرائح العملاء
CREATE INDEX IF NOT EXISTS idx_customer_segments_store ON public.customer_segments(store_id);
CREATE INDEX IF NOT EXISTS idx_segment_customers_segment ON public.segment_customers(segment_id);
CREATE INDEX IF NOT EXISTS idx_customer_analytics_store ON public.customer_analytics(store_id);

-- فهارس الرسائل
CREATE INDEX IF NOT EXISTS idx_message_campaigns_store ON public.message_campaigns(store_id);
CREATE INDEX IF NOT EXISTS idx_message_queue_status ON public.message_queue(status);
CREATE INDEX IF NOT EXISTS idx_message_history_store ON public.message_history(store_id);

-- فهارس الولاء
CREATE INDEX IF NOT EXISTS idx_loyalty_members_program ON public.loyalty_members(program_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_member ON public.loyalty_points_transactions(member_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_redemptions_member ON public.loyalty_redemptions(member_id);

-- ============================================================================
-- PART 10: سياسات RLS (Row Level Security)
-- ============================================================================

-- تفعيل RLS
ALTER TABLE public.report_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.heatmap_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.heatmap_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_assistant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_members ENABLE ROW LEVEL SECURITY;

-- سياسة الوصول للمتاجر
CREATE POLICY "Store owners can manage their data" ON public.report_settings
  FOR ALL USING (store_id IN (SELECT id FROM public.stores WHERE owner_id = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid())));

CREATE POLICY "Store owners can manage their reports" ON public.generated_reports
  FOR ALL USING (store_id IN (SELECT id FROM public.stores WHERE owner_id = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid())));

CREATE POLICY "Store owners can manage heatmap settings" ON public.heatmap_settings
  FOR ALL USING (store_id IN (SELECT id FROM public.stores WHERE owner_id = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid())));

CREATE POLICY "Store owners can manage heatmap events" ON public.heatmap_events
  FOR ALL USING (store_id IN (SELECT id FROM public.stores WHERE owner_id = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid())));

CREATE POLICY "Store owners can manage AI settings" ON public.ai_assistant_settings
  FOR ALL USING (store_id IN (SELECT id FROM public.stores WHERE owner_id = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid())));

CREATE POLICY "Store owners can manage AI conversations" ON public.ai_conversations
  FOR ALL USING (store_id IN (SELECT id FROM public.stores WHERE owner_id = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid())));

CREATE POLICY "Users can manage their AI messages" ON public.ai_messages
  FOR ALL USING (conversation_id IN (SELECT id FROM public.ai_conversations WHERE store_id IN (SELECT id FROM public.stores WHERE owner_id = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()))));

CREATE POLICY "Store owners can manage pricing" ON public.pricing_settings
  FOR ALL USING (store_id IN (SELECT id FROM public.stores WHERE owner_id = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid())));

CREATE POLICY "Store owners can manage pricing rules" ON public.pricing_rules
  FOR ALL USING (store_id IN (SELECT id FROM public.stores WHERE owner_id = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid())));

CREATE POLICY "Store owners can manage segments" ON public.customer_segments
  FOR ALL USING (store_id IN (SELECT id FROM public.stores WHERE owner_id = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid())));

CREATE POLICY "Store owners can manage message templates" ON public.message_templates
  FOR ALL USING (store_id IN (SELECT id FROM public.stores WHERE owner_id = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid())));

CREATE POLICY "Store owners can manage campaigns" ON public.message_campaigns
  FOR ALL USING (store_id IN (SELECT id FROM public.stores WHERE owner_id = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid())));

CREATE POLICY "Store owners can manage loyalty programs" ON public.loyalty_programs
  FOR ALL USING (store_id IN (SELECT id FROM public.stores WHERE owner_id = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid())));

CREATE POLICY "Store owners can view loyalty members" ON public.loyalty_members
  FOR ALL USING (program_id IN (SELECT id FROM public.loyalty_programs WHERE store_id IN (SELECT id FROM public.stores WHERE owner_id = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()))));

-- ============================================================================
-- DONE! ✅
-- ============================================================================
