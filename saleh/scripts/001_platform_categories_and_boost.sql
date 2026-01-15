-- ═══════════════════════════════════════════════════════════════════════════════
-- MBUY Platform Migration Script
-- Version: 1.0.0
-- Date: 2026-01-06
-- Description: إنشاء الجداول الناقصة لدعم فئات المنصة ونظام الـ Boost
-- ═══════════════════════════════════════════════════════════════════════════════

-- ╔═══════════════════════════════════════════════════════════════════════════════╗
-- ║                         1. PLATFORM CATEGORIES                                 ║
-- ║                         فئات المنصة الرئيسية                                   ║
-- ╚═══════════════════════════════════════════════════════════════════════════════╝

-- جدول فئات المنصة (تديرها الإدارة من mbuy-admin)
CREATE TABLE IF NOT EXISTS platform_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_en TEXT,
    slug TEXT UNIQUE NOT NULL,
    icon TEXT,                          -- اسم الأيقونة (Material Icons)
    image_url TEXT,                     -- صورة الفئة
    parent_id UUID REFERENCES platform_categories(id) ON DELETE SET NULL,
    "order" INTEGER DEFAULT 0,          -- ترتيب الظهور
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,  -- فئة مميزة في الصفحة الرئيسية
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for platform_categories
CREATE INDEX IF NOT EXISTS idx_platform_categories_parent_id ON platform_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_platform_categories_slug ON platform_categories(slug);
CREATE INDEX IF NOT EXISTS idx_platform_categories_is_active ON platform_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_platform_categories_order ON platform_categories("order");

-- ╔═══════════════════════════════════════════════════════════════════════════════╗
-- ║                         2. UPDATE PRODUCTS TABLE                               ║
-- ║                         إضافة أعمدة الفئة والـ Boost                           ║
-- ╚═══════════════════════════════════════════════════════════════════════════════╝

-- إضافة عمود فئة المنصة
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS platform_category_id UUID REFERENCES platform_categories(id) ON DELETE SET NULL;

-- إضافة أعمدة دعم الظهور (Boost)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS boost_points INTEGER DEFAULT 0;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS boost_expires_at TIMESTAMPTZ;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS boost_type TEXT; -- 'featured', 'category_top', 'search_top'

-- Index for platform_category_id
CREATE INDEX IF NOT EXISTS idx_products_platform_category_id ON products(platform_category_id);
CREATE INDEX IF NOT EXISTS idx_products_boost_expires_at ON products(boost_expires_at) WHERE boost_expires_at IS NOT NULL;

-- ╔═══════════════════════════════════════════════════════════════════════════════╗
-- ║                         3. UPDATE MERCHANTS TABLE                              ║
-- ║                         إضافة أعمدة الـ Boost للمتاجر                          ║
-- ╚═══════════════════════════════════════════════════════════════════════════════╝

ALTER TABLE merchants 
ADD COLUMN IF NOT EXISTS boost_points INTEGER DEFAULT 0;

ALTER TABLE merchants 
ADD COLUMN IF NOT EXISTS boost_expires_at TIMESTAMPTZ;

ALTER TABLE merchants 
ADD COLUMN IF NOT EXISTS boost_type TEXT; -- 'featured', 'home_banner'

CREATE INDEX IF NOT EXISTS idx_merchants_boost_expires_at ON merchants(boost_expires_at) WHERE boost_expires_at IS NOT NULL;

-- ╔═══════════════════════════════════════════════════════════════════════════════╗
-- ║                         4. BOOST TRANSACTIONS                                  ║
-- ║                         سجل معاملات دعم الظهور                                ║
-- ╚═══════════════════════════════════════════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS boost_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL,          -- 'product', 'store', 'media'
    target_id UUID NOT NULL,            -- ID of product/store/media
    boost_type TEXT NOT NULL,           -- 'featured', 'category_top', 'search_top', 'home_banner', 'media_for_you'
    points_spent INTEGER NOT NULL,
    duration_days INTEGER NOT NULL,
    starts_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'active',       -- 'active', 'expired', 'cancelled'
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_boost_transactions_merchant_id ON boost_transactions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_boost_transactions_target ON boost_transactions(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_boost_transactions_status ON boost_transactions(status);
CREATE INDEX IF NOT EXISTS idx_boost_transactions_expires_at ON boost_transactions(expires_at);

-- ╔═══════════════════════════════════════════════════════════════════════════════╗
-- ║                         5. INSERT DEFAULT PLATFORM CATEGORIES                  ║
-- ║                         إدراج الفئات الافتراضية                               ║
-- ╚═══════════════════════════════════════════════════════════════════════════════╝

INSERT INTO platform_categories (name, name_en, slug, icon, "order", is_active, is_featured) VALUES
    ('لك', 'For You', 'for-you', 'recommend', 1, true, true),
    ('مميز', 'Featured', 'featured', 'star', 2, true, true),
    ('عروض', 'Deals', 'deals', 'local_offer', 3, true, true),
    ('الكترونيات', 'Electronics', 'electronics', 'devices', 4, true, false),
    ('الجوالات', 'Phones', 'phones', 'smartphone', 5, true, false),
    ('الكمبيوتر وألعاب الفيديو', 'Computers & Gaming', 'computers-gaming', 'sports_esports', 6, true, false),
    ('الملابس وإكسسواراتها', 'Clothing & Accessories', 'clothing', 'checkroom', 7, true, false),
    ('زينة وقطع السيارات', 'Auto Parts & Accessories', 'auto', 'directions_car', 8, true, false),
    ('المنزل والحديقة', 'Home & Garden', 'home-garden', 'home', 9, true, false),
    ('الجمال', 'Beauty', 'beauty', 'spa', 10, true, false),
    ('الصحة والرياضة', 'Health & Sports', 'health-sports', 'fitness_center', 11, true, false),
    ('الكشتة والرحلات', 'Camping & Travel', 'camping-travel', 'hiking', 12, true, false),
    ('الشنط والإكسسوارات', 'Bags & Accessories', 'bags-accessories', 'shopping_bag', 13, true, false),
    ('الأطفال', 'Kids', 'kids', 'child_care', 14, true, false),
    ('اللوازم الدراسية والمكتبية', 'School & Office', 'school-office', 'edit', 15, true, false),
    ('الإنارة والمصابيح', 'Lighting', 'lighting', 'lightbulb', 16, true, false),
    ('المواد الخام', 'Raw Materials', 'raw-materials', 'inventory_2', 17, true, false)
ON CONFLICT (slug) DO NOTHING;

-- ╔═══════════════════════════════════════════════════════════════════════════════╗
-- ║                         6. INSERT SUBCATEGORIES                                ║
-- ║                         إدراج الفئات الفرعية                                   ║
-- ╚═══════════════════════════════════════════════════════════════════════════════╝

-- فئات فرعية للإلكترونيات
INSERT INTO platform_categories (name, name_en, slug, parent_id, "order", is_active) 
SELECT 'سماعات', 'Headphones', 'headphones', id, 1, true FROM platform_categories WHERE slug = 'electronics'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO platform_categories (name, name_en, slug, parent_id, "order", is_active) 
SELECT 'شواحن', 'Chargers', 'chargers', id, 2, true FROM platform_categories WHERE slug = 'electronics'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO platform_categories (name, name_en, slug, parent_id, "order", is_active) 
SELECT 'كاميرات', 'Cameras', 'cameras', id, 3, true FROM platform_categories WHERE slug = 'electronics'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO platform_categories (name, name_en, slug, parent_id, "order", is_active) 
SELECT 'حوامل الجوال', 'Phone Holders', 'phone-holders', id, 4, true FROM platform_categories WHERE slug = 'electronics'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO platform_categories (name, name_en, slug, parent_id, "order", is_active) 
SELECT 'مكبرات الصوت', 'Speakers', 'speakers', id, 5, true FROM platform_categories WHERE slug = 'electronics'
ON CONFLICT (slug) DO NOTHING;

-- فئات فرعية للجوالات
INSERT INTO platform_categories (name, name_en, slug, parent_id, "order", is_active) 
SELECT 'آيفون', 'iPhone', 'iphone', id, 1, true FROM platform_categories WHERE slug = 'phones'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO platform_categories (name, name_en, slug, parent_id, "order", is_active) 
SELECT 'سامسونج', 'Samsung', 'samsung', id, 2, true FROM platform_categories WHERE slug = 'phones'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO platform_categories (name, name_en, slug, parent_id, "order", is_active) 
SELECT 'هواوي', 'Huawei', 'huawei', id, 3, true FROM platform_categories WHERE slug = 'phones'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO platform_categories (name, name_en, slug, parent_id, "order", is_active) 
SELECT 'شاومي', 'Xiaomi', 'xiaomi', id, 4, true FROM platform_categories WHERE slug = 'phones'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO platform_categories (name, name_en, slug, parent_id, "order", is_active) 
SELECT 'كفرات وحمايات', 'Cases & Protectors', 'cases-protectors', id, 5, true FROM platform_categories WHERE slug = 'phones'
ON CONFLICT (slug) DO NOTHING;

-- فئات فرعية للكمبيوتر وألعاب الفيديو
INSERT INTO platform_categories (name, name_en, slug, parent_id, "order", is_active) 
SELECT 'لابتوب', 'Laptops', 'laptops', id, 1, true FROM platform_categories WHERE slug = 'computers-gaming'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO platform_categories (name, name_en, slug, parent_id, "order", is_active) 
SELECT 'بلايستيشن', 'PlayStation', 'playstation', id, 2, true FROM platform_categories WHERE slug = 'computers-gaming'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO platform_categories (name, name_en, slug, parent_id, "order", is_active) 
SELECT 'اكسبوكس', 'Xbox', 'xbox', id, 3, true FROM platform_categories WHERE slug = 'computers-gaming'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO platform_categories (name, name_en, slug, parent_id, "order", is_active) 
SELECT 'ملحقات قيمنق', 'Gaming Accessories', 'gaming-accessories', id, 4, true FROM platform_categories WHERE slug = 'computers-gaming'
ON CONFLICT (slug) DO NOTHING;

-- فئات فرعية للملابس
INSERT INTO platform_categories (name, name_en, slug, parent_id, "order", is_active) 
SELECT 'بلوزات', 'Blouses', 'blouses', id, 1, true FROM platform_categories WHERE slug = 'clothing'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO platform_categories (name, name_en, slug, parent_id, "order", is_active) 
SELECT 'فساتين', 'Dresses', 'dresses', id, 2, true FROM platform_categories WHERE slug = 'clothing'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO platform_categories (name, name_en, slug, parent_id, "order", is_active) 
SELECT 'بناطيل', 'Pants', 'pants', id, 3, true FROM platform_categories WHERE slug = 'clothing'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO platform_categories (name, name_en, slug, parent_id, "order", is_active) 
SELECT 'ملابس رياضية', 'Sportswear', 'sportswear', id, 4, true FROM platform_categories WHERE slug = 'clothing'
ON CONFLICT (slug) DO NOTHING;

-- فئات فرعية للمنزل والحديقة
INSERT INTO platform_categories (name, name_en, slug, parent_id, "order", is_active) 
SELECT 'أثاث', 'Furniture', 'furniture', id, 1, true FROM platform_categories WHERE slug = 'home-garden'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO platform_categories (name, name_en, slug, parent_id, "order", is_active) 
SELECT 'ديكور', 'Decor', 'decor', id, 2, true FROM platform_categories WHERE slug = 'home-garden'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO platform_categories (name, name_en, slug, parent_id, "order", is_active) 
SELECT 'مطبخ', 'Kitchen', 'kitchen', id, 3, true FROM platform_categories WHERE slug = 'home-garden'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO platform_categories (name, name_en, slug, parent_id, "order", is_active) 
SELECT 'حديقة', 'Garden', 'garden', id, 4, true FROM platform_categories WHERE slug = 'home-garden'
ON CONFLICT (slug) DO NOTHING;

-- فئات فرعية للجمال
INSERT INTO platform_categories (name, name_en, slug, parent_id, "order", is_active) 
SELECT 'عطور', 'Perfumes', 'perfumes', id, 1, true FROM platform_categories WHERE slug = 'beauty'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO platform_categories (name, name_en, slug, parent_id, "order", is_active) 
SELECT 'مكياج', 'Makeup', 'makeup', id, 2, true FROM platform_categories WHERE slug = 'beauty'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO platform_categories (name, name_en, slug, parent_id, "order", is_active) 
SELECT 'عناية بالبشرة', 'Skincare', 'skincare', id, 3, true FROM platform_categories WHERE slug = 'beauty'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO platform_categories (name, name_en, slug, parent_id, "order", is_active) 
SELECT 'عناية بالشعر', 'Haircare', 'haircare', id, 4, true FROM platform_categories WHERE slug = 'beauty'
ON CONFLICT (slug) DO NOTHING;

-- ╔═══════════════════════════════════════════════════════════════════════════════╗
-- ║                         7. FUNCTIONS & TRIGGERS                                ║
-- ║                         الدوال والـ Triggers                                   ║
-- ╚═══════════════════════════════════════════════════════════════════════════════╝

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for platform_categories
DROP TRIGGER IF EXISTS update_platform_categories_updated_at ON platform_categories;
CREATE TRIGGER update_platform_categories_updated_at
    BEFORE UPDATE ON platform_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to expire boosts automatically
CREATE OR REPLACE FUNCTION expire_boosts()
RETURNS void AS $$
BEGIN
    -- Expire product boosts
    UPDATE products 
    SET boost_points = 0, boost_type = NULL, boost_expires_at = NULL
    WHERE boost_expires_at < now() AND boost_expires_at IS NOT NULL;
    
    -- Expire merchant boosts
    UPDATE merchants 
    SET boost_points = 0, boost_type = NULL, boost_expires_at = NULL
    WHERE boost_expires_at < now() AND boost_expires_at IS NOT NULL;
    
    -- Update boost_transactions status
    UPDATE boost_transactions 
    SET status = 'expired'
    WHERE expires_at < now() AND status = 'active';
END;
$$ LANGUAGE plpgsql;

-- ╔═══════════════════════════════════════════════════════════════════════════════╗
-- ║                         8. RLS POLICIES                                        ║
-- ║                         سياسات الأمان                                         ║
-- ╚═══════════════════════════════════════════════════════════════════════════════╝

-- Enable RLS
ALTER TABLE platform_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE boost_transactions ENABLE ROW LEVEL SECURITY;

-- Platform categories: Public read, Admin write
CREATE POLICY "platform_categories_public_read" ON platform_categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "platform_categories_admin_all" ON platform_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_staff WHERE id = auth.uid()
        )
    );

-- Boost transactions: Merchant can see own, Admin can see all
CREATE POLICY "boost_transactions_merchant_read" ON boost_transactions
    FOR SELECT USING (merchant_id = auth.uid());

CREATE POLICY "boost_transactions_merchant_insert" ON boost_transactions
    FOR INSERT WITH CHECK (merchant_id = auth.uid());

CREATE POLICY "boost_transactions_admin_all" ON boost_transactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_staff WHERE id = auth.uid()
        )
    );

-- ╔═══════════════════════════════════════════════════════════════════════════════╗
-- ║                         DONE!                                                  ║
-- ╚═══════════════════════════════════════════════════════════════════════════════╝

-- Verification query
SELECT 
    'platform_categories' as table_name, 
    COUNT(*) as row_count 
FROM platform_categories
UNION ALL
SELECT 
    'boost_transactions', 
    COUNT(*) 
FROM boost_transactions;
