-- =====================================================
-- Seed Platform Categories
-- Run this in Supabase SQL Editor
-- =====================================================

-- Clear existing categories (optional - comment out if you want to keep existing)
-- DELETE FROM platform_categories;

-- Insert main categories
INSERT INTO platform_categories (name, name_en, slug, icon, is_active, is_featured, "order") VALUES
-- Main Categories
('إلكترونيات', 'Electronics', 'electronics', 'devices', true, true, 1),
('هواتف وأجهزة', 'Phones & Devices', 'phones-devices', 'smartphone', true, true, 2),
('ملابس رجالية', 'Men''s Fashion', 'mens-fashion', 'male', true, true, 3),
('ملابس نسائية', 'Women''s Fashion', 'womens-fashion', 'female', true, true, 4),
('أطفال وألعاب', 'Kids & Toys', 'kids-toys', 'child_care', true, true, 5),
('منزل ومطبخ', 'Home & Kitchen', 'home-kitchen', 'home', true, true, 6),
('جمال وعناية', 'Beauty & Care', 'beauty-care', 'spa', true, true, 7),
('رياضة ولياقة', 'Sports & Fitness', 'sports-fitness', 'fitness_center', true, true, 8),
('سيارات ودراجات', 'Automotive', 'automotive', 'directions_car', true, true, 9),
('كتب وقرطاسية', 'Books & Stationery', 'books-stationery', 'menu_book', true, true, 10),
('طعام ومشروبات', 'Food & Beverages', 'food-beverages', 'restaurant', true, true, 11),
('صحة ودواء', 'Health & Medicine', 'health-medicine', 'medical_services', true, true, 12)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  icon = EXCLUDED.icon,
  is_active = EXCLUDED.is_active,
  is_featured = EXCLUDED.is_featured,
  "order" = EXCLUDED."order",
  updated_at = now();

-- Verify insertion
SELECT id, name, name_en, slug, icon, is_active, "order" 
FROM platform_categories 
ORDER BY "order";
