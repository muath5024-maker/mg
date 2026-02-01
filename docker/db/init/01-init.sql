-- ============================================
-- MBUY Development Database Initialization
-- ============================================
-- هذا الملف يعمل تلقائياً عند إنشاء قاعدة البيانات

-- إنشاء قاعدة بيانات n8n إذا لم تكن موجودة
CREATE DATABASE n8n;

-- التأكد من أن mbuy_dev موجودة
CREATE DATABASE IF NOT EXISTS mbuy_dev;

-- الاتصال بقاعدة البيانات الرئيسية
\c mbuy_dev;

-- تفعيل Extensions المطلوبة
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- ============================================
-- إنشاء Schema الأساسي
-- ============================================

-- جدول المستخدمين (مبسط للتطوير)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    full_name VARCHAR(255),
    user_type VARCHAR(50) DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول المتاجر
CREATE TABLE IF NOT EXISTS stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    description TEXT,
    logo_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول المنتجات
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INTEGER DEFAULT 0,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول الطلبات
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES users(id),
    store_id UUID REFERENCES stores(id),
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Indexes للأداء
-- ============================================
CREATE INDEX idx_products_store_id ON products(store_id);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_store_id ON orders(store_id);
CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- بيانات تجريبية للتطوير
-- ============================================

-- مستخدم تجريبي (تاجر)
INSERT INTO users (email, full_name, user_type) 
VALUES ('merchant@mbuy.dev', 'Test Merchant', 'merchant')
ON CONFLICT (email) DO NOTHING;

-- مستخدم تجريبي (عميل)
INSERT INTO users (email, full_name, user_type) 
VALUES ('customer@mbuy.dev', 'Test Customer', 'customer')
ON CONFLICT (email) DO NOTHING;

-- متجر تجريبي
INSERT INTO stores (owner_id, name, slug, description)
SELECT id, 'Test Store', 'test-store', 'متجر تجريبي للتطوير'
FROM users WHERE email = 'merchant@mbuy.dev'
ON CONFLICT (slug) DO NOTHING;

-- منتج تجريبي
INSERT INTO products (store_id, name, description, price, stock_quantity)
SELECT s.id, 'منتج تجريبي', 'وصف المنتج التجريبي', 99.99, 100
FROM stores s WHERE s.slug = 'test-store'
ON CONFLICT DO NOTHING;

-- ============================================
-- Functions & Triggers
-- ============================================

-- Function لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إضافة Triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- عرض رسالة نجاح
DO $$
BEGIN
    RAISE NOTICE 'MBUY Development Database initialized successfully!';
END $$;
