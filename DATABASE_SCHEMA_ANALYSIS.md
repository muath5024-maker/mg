# 📊 تحليل شامل - قاعدة بيانات MBUY

## 📋 نظرة عامة

**إجمالي الجداول:** 25 جدول  
**إجمالي العلاقات (Foreign Keys):** 30+ علاقة  
**إجمالي الفهارس (Indexes):** 50+ فهرس  

---

## 🔗 العلاقات الأساسية (Core Relationships)

```
auth.users (Supabase Auth)
    ↓
user_profiles (id = auth.users.id)
    ↓
stores (owner_id = user_profiles.id)
    ↓
products (store_id = stores.id)
```

---

## 📊 الجداول التفصيلية

### 1. 👤 `user_profiles` - ملفات المستخدمين

**الوصف:** معلومات المستخدمين الأساسية  
**المفاتيح الأساسية:** `id` (UUID)  
**العلاقات:**
- `id` → `auth.users(id)` (ON DELETE CASCADE)

**الحقول:**
- `id` - UUID (Primary Key, references auth.users)
- `role` - TEXT (admin, merchant, customer)
- `display_name` - TEXT
- `phone` - TEXT
- `avatar_url` - TEXT
- `email` - TEXT
- `created_at` - TIMESTAMPTZ
- `updated_at` - TIMESTAMPTZ

**الفهارس:**
- `idx_user_profiles_role` - على `role`

**الملاحظات:**
- ✅ ربط مباشر بـ Supabase Auth
- ✅ دعم 3 أنواع من الأدوار

---

### 2. 🏪 `stores` - المتاجر

**الوصف:** معلومات المتاجر  
**المفاتيح الأساسية:** `id` (UUID)  
**العلاقات:**
- `owner_id` → `user_profiles(id)` (ON DELETE CASCADE)

**الحقول:**
- `id` - UUID (Primary Key)
- `owner_id` - UUID (Foreign Key → user_profiles)
- `name` - TEXT (NOT NULL)
- `description` - TEXT
- `slug` - TEXT (UNIQUE)
- `city` - TEXT
- `address` - TEXT
- `latitude` - DECIMAL(10, 8)
- `longitude` - DECIMAL(11, 8)
- `phone` - TEXT
- `logo_url` - TEXT
- `cover_image_url` - TEXT
- `rating` - DECIMAL(3, 2) DEFAULT 0
- `followers_count` - INTEGER DEFAULT 0
- `is_verified` - BOOLEAN DEFAULT false
- `visibility` - TEXT (public, private)
- `status` - TEXT (active, inactive, suspended)
- `boosted_until` - TIMESTAMPTZ
- `map_highlight_until` - TIMESTAMPTZ
- `created_at` - TIMESTAMPTZ
- `updated_at` - TIMESTAMPTZ

**الفهارس:**
- `idx_stores_owner_id` - على `owner_id`
- `idx_stores_slug` - على `slug` (UNIQUE)
- `idx_stores_city` - على `city`
- `idx_stores_status` - على `status`
- `idx_stores_boosted_until` - على `boosted_until`

**الملاحظات:**
- ✅ دعم الموقع الجغرافي (lat/lng)
- ✅ دعم التعزيز والإبراز على الخريطة
- ✅ نظام تصنيف ومتابعين

---

### 3. 📦 `products` - المنتجات

**الوصف:** منتجات المتاجر  
**المفاتيح الأساسية:** `id` (UUID)  
**العلاقات:**
- `store_id` → `stores(id)` (ON DELETE CASCADE)

**الحقول:**
- `id` - UUID (Primary Key)
- `store_id` - UUID (Foreign Key → stores, NOT NULL)
- `name` - TEXT (NOT NULL)
- `description` - TEXT
- `price` - DECIMAL(10, 2) (NOT NULL)
- `compare_at_price` - DECIMAL(10, 2)
- `cost_per_item` - DECIMAL(10, 2)
- `stock` - INTEGER DEFAULT 0 ⚠️
- `sku` - TEXT
- `barcode` - TEXT
- `image_url` - TEXT
- `main_image_url` - TEXT
- `weight` - DECIMAL(10, 2)
- `dimensions` - JSONB
- `status` - TEXT (active, draft, archived)
- `is_featured` - BOOLEAN DEFAULT false
- `rating` - DECIMAL(3, 2) DEFAULT 0
- `reviews_count` - INTEGER DEFAULT 0
- `sales_count` - INTEGER DEFAULT 0
- `created_at` - TIMESTAMPTZ
- `updated_at` - TIMESTAMPTZ

**الفهارس:**
- `idx_products_store_id` - على `store_id`
- `idx_products_status` - على `status`
- `idx_products_is_featured` - على `is_featured`
- `idx_products_price` - على `price`

**⚠️ ملاحظات مهمة:**
- حقل `stock` يستخدم (وليس `stock_quantity`)
- دعم JSONB للأبعاد
- نظام تقييم ومبيعات

---

### 4. 🏷️ `categories` - الفئات

**الوصف:** فئات المنتجات (هرمية)  
**المفاتيح الأساسية:** `id` (UUID)  
**العلاقات:**
- `parent_id` → `categories(id)` (ON DELETE CASCADE) - Self-referencing

**الحقول:**
- `id` - UUID (Primary Key)
- `name` - TEXT (NOT NULL)
- `name_ar` - TEXT
- `description` - TEXT
- `parent_id` - UUID (Foreign Key → categories)
- `icon` - TEXT
- `image_url` - TEXT
- `slug` - TEXT (UNIQUE, NOT NULL)
- `display_order` - INTEGER DEFAULT 0
- `is_active` - BOOLEAN DEFAULT true
- `created_at` - TIMESTAMPTZ
- `updated_at` - TIMESTAMPTZ

**الفهارس:**
- `idx_categories_parent_id` - على `parent_id`
- `idx_categories_slug` - على `slug` (UNIQUE)
- `idx_categories_is_active` - على `is_active`

**الملاحظات:**
- ✅ دعم الفئات الهرمية (فئات رئيسية وفرعية)
- ✅ دعم اللغة العربية

---

### 5. 🔗 `product_categories` - ربط المنتجات بالفئات

**الوصف:** جدول ربط (Many-to-Many) بين المنتجات والفئات  
**المفاتيح الأساسية:** `id` (UUID)  
**العلاقات:**
- `product_id` → `products(id)` (ON DELETE CASCADE)
- `category_id` → `categories(id)` (ON DELETE CASCADE)

**الحقول:**
- `id` - UUID (Primary Key)
- `product_id` - UUID (Foreign Key → products, NOT NULL)
- `category_id` - UUID (Foreign Key → categories, NOT NULL)
- `created_at` - TIMESTAMPTZ

**القيود:**
- `UNIQUE(product_id, category_id)` - منع التكرار

**الفهارس:**
- `idx_product_categories_product_id` - على `product_id`
- `idx_product_categories_category_id` - على `category_id`

---

### 6. 🖼️ `product_media` - صور المنتجات

**الوصف:** صور وفيديوهات المنتجات  
**المفاتيح الأساسية:** `id` (UUID)  
**العلاقات:**
- `product_id` → `products(id)` (ON DELETE CASCADE)

**الحقول:**
- `id` - UUID (Primary Key)
- `product_id` - UUID (Foreign Key → products, NOT NULL)
- `media_url` - TEXT (NOT NULL)
- `media_type` - TEXT (image, video)
- `display_order` - INTEGER DEFAULT 0
- `is_primary` - BOOLEAN DEFAULT false
- `created_at` - TIMESTAMPTZ

**الفهارس:**
- `idx_product_media_product_id` - على `product_id`

---

### 7. 🛒 `carts` - السلة

**الوصف:** سلة التسوق للمستخدمين  
**المفاتيح الأساسية:** `id` (UUID)  
**العلاقات:**
- `user_id` → `user_profiles(id)` (ON DELETE CASCADE)

**الحقول:**
- `id` - UUID (Primary Key)
- `user_id` - UUID (Foreign Key → user_profiles, NOT NULL)
- `created_at` - TIMESTAMPTZ
- `updated_at` - TIMESTAMPTZ

**القيود:**
- `UNIQUE(user_id)` - سلة واحدة لكل مستخدم

**الفهارس:**
- `idx_carts_user_id` - على `user_id`

---

### 8. 📝 `cart_items` - عناصر السلة

**الوصف:** المنتجات في السلة  
**المفاتيح الأساسية:** `id` (UUID)  
**العلاقات:**
- `cart_id` → `carts(id)` (ON DELETE CASCADE)
- `product_id` → `products(id)` (ON DELETE CASCADE)

**الحقول:**
- `id` - UUID (Primary Key)
- `cart_id` - UUID (Foreign Key → carts, NOT NULL)
- `product_id` - UUID (Foreign Key → products, NOT NULL)
- `quantity` - INTEGER (NOT NULL, DEFAULT 1)
- `added_at` - TIMESTAMPTZ

**القيود:**
- `UNIQUE(cart_id, product_id)` - منع تكرار المنتج في السلة

**الفهارس:**
- `idx_cart_items_cart_id` - على `cart_id`
- `idx_cart_items_product_id` - على `product_id`

---

### 9. 📦 `orders` - الطلبات

**الوصف:** طلبات الشراء  
**المفاتيح الأساسية:** `id` (UUID)  
**العلاقات:**
- `customer_id` → `user_profiles(id)` (ON DELETE CASCADE)
- `store_id` → `stores(id)` (ON DELETE CASCADE)

**الحقول:**
- `id` - UUID (Primary Key)
- `order_number` - TEXT (UNIQUE)
- `customer_id` - UUID (Foreign Key → user_profiles, NOT NULL)
- `store_id` - UUID (Foreign Key → stores, NOT NULL)
- `status` - TEXT (pending, confirmed, processing, shipped, delivered, cancelled)
- `payment_status` - TEXT (pending, paid, failed, refunded)
- `payment_method` - TEXT (wallet, cash, card, bank_transfer)
- `subtotal` - DECIMAL(10, 2) (NOT NULL)
- `discount_amount` - DECIMAL(10, 2) DEFAULT 0
- `tax_amount` - DECIMAL(10, 2) DEFAULT 0
- `shipping_amount` - DECIMAL(10, 2) DEFAULT 0
- `total_amount` - DECIMAL(10, 2) (NOT NULL)
- `notes` - TEXT
- `shipping_address` - JSONB
- `coupon_code` - TEXT
- `created_at` - TIMESTAMPTZ
- `updated_at` - TIMESTAMPTZ

**الفهارس:**
- `idx_orders_customer_id` - على `customer_id`
- `idx_orders_store_id` - على `store_id`
- `idx_orders_status` - على `status`
- `idx_orders_order_number` - على `order_number` (UNIQUE)

**الملاحظات:**
- ✅ دعم عناوين الشحن بـ JSONB
- ✅ نظام حالات متعدد (الطلب + الدفع)

---

### 10. 📋 `order_items` - عناصر الطلب

**الوصف:** المنتجات في الطلب  
**المفاتيح الأساسية:** `id` (UUID)  
**العلاقات:**
- `order_id` → `orders(id)` (ON DELETE CASCADE)
- `product_id` → `products(id)` (ON DELETE RESTRICT)

**الحقول:**
- `id` - UUID (Primary Key)
- `order_id` - UUID (Foreign Key → orders, NOT NULL)
- `product_id` - UUID (Foreign Key → products, NOT NULL)
- `product_name` - TEXT (NOT NULL) - Snapshots للاسم وقت الطلب
- `product_image_url` - TEXT - Snapshots للصورة وقت الطلب
- `quantity` - INTEGER (NOT NULL)
- `price` - DECIMAL(10, 2) (NOT NULL) - Snapshots للسعر وقت الطلب
- `total` - DECIMAL(10, 2) (NOT NULL)
- `created_at` - TIMESTAMPTZ

**الفهارس:**
- `idx_order_items_order_id` - على `order_id`

**الملاحظات:**
- ✅ حفظ Snapshots (اسم، صورة، سعر) لحفظ بيانات الطلب التاريخية
- ✅ `ON DELETE RESTRICT` على `product_id` - منع حذف المنتج إذا كان في طلب

---

### 11. 💰 `wallets` - المحافظ

**الوصف:** محافظ المستخدمين (عملاء وتجار)  
**المفاتيح الأساسية:** `id` (UUID)  
**العلاقات:**
- `owner_id` → `user_profiles(id)` (ON DELETE CASCADE)

**الحقول:**
- `id` - UUID (Primary Key)
- `owner_id` - UUID (Foreign Key → user_profiles, NOT NULL)
- `type` - TEXT (customer, merchant)
- `balance` - DECIMAL(10, 2) DEFAULT 0
- `currency` - TEXT DEFAULT 'SAR'
- `is_active` - BOOLEAN DEFAULT true
- `created_at` - TIMESTAMPTZ
- `updated_at` - TIMESTAMPTZ

**القيود:**
- `UNIQUE(owner_id, type)` - محفظة واحدة من كل نوع لكل مستخدم

**الفهارس:**
- `idx_wallets_owner_id` - على `owner_id`

**الملاحظات:**
- ✅ دعم محافظ متعددة (عميل + تاجر)

---

### 12. 💸 `wallet_transactions` - معاملات المحفظة

**الوصف:** سجل معاملات المحفظة  
**المفاتيح الأساسية:** `id` (UUID)  
**العلاقات:**
- `wallet_id` → `wallets(id)` (ON DELETE CASCADE)

**الحقول:**
- `id` - UUID (Primary Key)
- `wallet_id` - UUID (Foreign Key → wallets, NOT NULL)
- `type` - TEXT (deposit, withdraw, commission, cashback, refund)
- `amount` - DECIMAL(10, 2) (NOT NULL)
- `balance_after` - DECIMAL(10, 2) (NOT NULL)
- `description` - TEXT
- `reference_type` - TEXT (order, transfer, manual)
- `reference_id` - UUID
- `meta` - JSONB
- `created_at` - TIMESTAMPTZ

**الفهارس:**
- `idx_wallet_transactions_wallet_id` - على `wallet_id`
- `idx_wallet_transactions_created_at` - على `created_at`

**الملاحظات:**
- ✅ حفظ الرصيد بعد كل معاملة
- ✅ ربط بمرجع خارجي (order, transfer, etc.)

---

### 13. 🎯 `points_accounts` - حسابات النقاط

**الوصف:** حسابات النقاط للمستخدمين  
**المفاتيح الأساسية:** `id` (UUID)  
**العلاقات:**
- `user_id` → `user_profiles(id)` (ON DELETE CASCADE)

**الحقول:**
- `id` - UUID (Primary Key)
- `user_id` - UUID (Foreign Key → user_profiles, NOT NULL)
- `account_type` - TEXT (merchant, customer)
- `points_balance` - INTEGER DEFAULT 0
- `created_at` - TIMESTAMPTZ
- `updated_at` - TIMESTAMPTZ

**القيود:**
- `UNIQUE(user_id, account_type)` - حساب نقاط واحد من كل نوع لكل مستخدم

**الفهارس:**
- `idx_points_accounts_user_id` - على `user_id`

---

### 14. ⭐ `points_transactions` - معاملات النقاط

**الوصف:** سجل معاملات النقاط  
**المفاتيح الأساسية:** `id` (UUID)  
**العلاقات:**
- `points_account_id` → `points_accounts(id)` (ON DELETE CASCADE)

**الحقول:**
- `id` - UUID (Primary Key)
- `points_account_id` - UUID (Foreign Key → points_accounts, NOT NULL)
- `type` - TEXT (earn, spend, refund, adjustment)
- `points_amount` - INTEGER (NOT NULL)
- `balance_after` - INTEGER (NOT NULL)
- `description` - TEXT
- `reference_type` - TEXT (feature, purchase, reward, manual)
- `reference_id` - UUID
- `meta` - JSONB
- `created_at` - TIMESTAMPTZ

**الفهارس:**
- `idx_points_transactions_points_account_id` - على `points_account_id`

---

### 15. 🚀 `feature_actions` - الميزات المدفوعة

**الوصف:** الميزات التي يمكن شراؤها بالنقاط  
**المفاتيح الأساسية:** `id` (UUID)  

**الحقول:**
- `id` - UUID (Primary Key)
- `action_name` - TEXT (UNIQUE, NOT NULL)
- `action_name_ar` - TEXT
- `description` - TEXT
- `points_cost` - INTEGER (NOT NULL)
- `duration_hours` - INTEGER
- `is_active` - BOOLEAN DEFAULT true
- `created_at` - TIMESTAMPTZ

**الفهارس:**
- `idx_feature_actions_is_active` - على `is_active`

**البيانات الأولية:**
- boost_store_24h (100 نقطة)
- boost_store_48h (180 نقطة)
- boost_store_7d (500 نقطة)
- highlight_map_24h (50 نقطة)
- highlight_map_7d (300 نقطة)
- generate_video (200 نقطة)

---

### 16. 🎫 `coupons` - الكوبونات

**الوصف:** كوبونات الخصم  
**المفاتيح الأساسية:** `id` (UUID)  
**العلاقات:**
- `user_id` → `user_profiles(id)` (اختياري)
- `store_id` → `stores(id)` (اختياري)

**الحقول:**
- `id` - UUID (Primary Key)
- `code` - TEXT (UNIQUE, NOT NULL)
- `discount_type` - TEXT (percentage, fixed)
- `discount_value` - DECIMAL(10, 2) (NOT NULL)
- `min_order_amount` - DECIMAL(10, 2) DEFAULT 0
- `max_discount_amount` - DECIMAL(10, 2)
- `usage_limit` - INTEGER
- `usage_count` - INTEGER DEFAULT 0
- `user_id` - UUID (Foreign Key → user_profiles, optional)
- `store_id` - UUID (Foreign Key → stores, optional)
- `starts_at` - TIMESTAMPTZ
- `expires_at` - TIMESTAMPTZ
- `is_active` - BOOLEAN DEFAULT true
- `created_at` - TIMESTAMPTZ

**الفهارس:**
- `idx_coupons_code` - على `code` (UNIQUE)
- `idx_coupons_is_active` - على `is_active`

---

### 17. 🎟️ `coupon_redemptions` - استخدام الكوبونات

**الوصف:** سجل استخدام الكوبونات  
**المفاتيح الأساسية:** `id` (UUID)  
**العلاقات:**
- `coupon_id` → `coupons(id)` (ON DELETE CASCADE)
- `user_id` → `user_profiles(id)` (ON DELETE CASCADE)
- `order_id` → `orders(id)` (ON DELETE SET NULL)

**الحقول:**
- `id` - UUID (Primary Key)
- `coupon_id` - UUID (Foreign Key → coupons, NOT NULL)
- `user_id` - UUID (Foreign Key → user_profiles, NOT NULL)
- `order_id` - UUID (Foreign Key → orders)
- `discount_amount` - DECIMAL(10, 2) (NOT NULL)
- `redeemed_at` - TIMESTAMPTZ

**الفهارس:**
- `idx_coupon_redemptions_coupon_id` - على `coupon_id`
- `idx_coupon_redemptions_user_id` - على `user_id`

---

### 18. ❤️ `favorites` - المفضلة

**الوصف:** المنتجات المفضلة للمستخدمين  
**المفاتيح الأساسية:** `id` (UUID)  
**العلاقات:**
- `user_id` → `user_profiles(id)` (ON DELETE CASCADE)
- `product_id` → `products(id)` (ON DELETE CASCADE)

**الحقول:**
- `id` - UUID (Primary Key)
- `user_id` - UUID (Foreign Key → user_profiles, NOT NULL)
- `product_id` - UUID (Foreign Key → products, NOT NULL)
- `created_at` - TIMESTAMPTZ

**القيود:**
- `UNIQUE(user_id, product_id)` - منع تكرار المنتج في المفضلة

**الفهارس:**
- `idx_favorites_user_id` - على `user_id`
- `idx_favorites_product_id` - على `product_id`

---

### 19. 👥 `store_followers` - متابعو المتاجر

**الوصف:** المستخدمون الذين يتابعون المتاجر  
**المفاتيح الأساسية:** `id` (UUID)  
**العلاقات:**
- `store_id` → `stores(id)` (ON DELETE CASCADE)
- `user_id` → `user_profiles(id)` (ON DELETE CASCADE)

**الحقول:**
- `id` - UUID (Primary Key)
- `store_id` - UUID (Foreign Key → stores, NOT NULL)
- `user_id` - UUID (Foreign Key → user_profiles, NOT NULL)
- `followed_at` - TIMESTAMPTZ

**القيود:**
- `UNIQUE(store_id, user_id)` - منع متابعة مزدوجة

**الفهارس:**
- `idx_store_followers_store_id` - على `store_id`
- `idx_store_followers_user_id` - على `user_id`

---

### 20. 📸 `stories` - قصص المتاجر

**الوصف:** قصص المتاجر (مثل Instagram Stories)  
**المفاتيح الأساسية:** `id` (UUID)  
**العلاقات:**
- `store_id` → `stores(id)` (ON DELETE CASCADE)

**الحقول:**
- `id` - UUID (Primary Key)
- `store_id` - UUID (Foreign Key → stores, NOT NULL)
- `title` - TEXT
- `media_url` - TEXT (NOT NULL)
- `media_type` - TEXT (image, video)
- `link_url` - TEXT
- `view_count` - INTEGER DEFAULT 0
- `expires_at` - TIMESTAMPTZ (DEFAULT NOW() + 24 hours)
- `is_active` - BOOLEAN DEFAULT true
- `created_at` - TIMESTAMPTZ

**الفهارس:**
- `idx_stories_store_id` - على `store_id`
- `idx_stories_expires_at` - على `expires_at`

**الملاحظات:**
- ✅ انتهاء تلقائي بعد 24 ساعة
- ✅ دعم روابط تفاعلية

---

### 21. 💬 `conversations` - المحادثات

**الوصف:** محادثات بين العملاء والتجار  
**المفاتيح الأساسية:** `id` (UUID)  
**العلاقات:**
- `customer_id` → `user_profiles(id)` (ON DELETE CASCADE)
- `merchant_id` → `stores(id)` (ON DELETE CASCADE) ⚠️

**الحقول:**
- `id` - UUID (Primary Key)
- `customer_id` - UUID (Foreign Key → user_profiles, NOT NULL)
- `merchant_id` - UUID (Foreign Key → stores, NOT NULL) ⚠️
- `last_message_at` - TIMESTAMPTZ
- `is_active` - BOOLEAN DEFAULT true
- `created_at` - TIMESTAMPTZ

**القيود:**
- `UNIQUE(customer_id, merchant_id)` - محادثة واحدة لكل زوج

**الفهارس:**
- `idx_conversations_customer_id` - على `customer_id`
- `idx_conversations_merchant_id` - على `merchant_id`

**⚠️ ملاحظة:**
- `merchant_id` يشير إلى `stores` وليس `user_profiles` - قد يكون خطأ تصميم

---

### 22. 💬 `messages` - الرسائل

**الوصف:** الرسائل في المحادثات  
**المفاتيح الأساسية:** `id` (UUID)  
**العلاقات:**
- `conversation_id` → `conversations(id)` (ON DELETE CASCADE)
- `sender_id` → `user_profiles(id)` (ON DELETE CASCADE)

**الحقول:**
- `id` - UUID (Primary Key)
- `conversation_id` - UUID (Foreign Key → conversations, NOT NULL)
- `sender_id` - UUID (Foreign Key → user_profiles, NOT NULL)
- `content` - TEXT (NOT NULL)
- `media_url` - TEXT
- `is_read` - BOOLEAN DEFAULT false
- `created_at` - TIMESTAMPTZ

**الفهارس:**
- `idx_messages_conversation_id` - على `conversation_id`
- `idx_messages_created_at` - على `created_at`

---

### 23. 📱 `device_tokens` - رموز الأجهزة (FCM)

**الوصف:** رموز FCM للإشعارات  
**المفاتيح الأساسية:** `id` (UUID)  
**العلاقات:**
- `user_id` → `user_profiles(id)` (ON DELETE CASCADE)

**الحقول:**
- `id` - UUID (Primary Key)
- `user_id` - UUID (Foreign Key → user_profiles, NOT NULL)
- `token` - TEXT (UNIQUE, NOT NULL)
- `platform` - TEXT (android, ios, web)
- `device_model` - TEXT
- `app_version` - TEXT
- `is_active` - BOOLEAN DEFAULT true
- `last_used_at` - TIMESTAMPTZ
- `created_at` - TIMESTAMPTZ

**الفهارس:**
- `idx_device_tokens_user_id` - على `user_id`
- `idx_device_tokens_token` - على `token` (UNIQUE)

---

### 24. 📦 `packages` - الباقات

**الوصف:** باقات الاشتراك للمتاجر  
**المفاتيح الأساسية:** `id` (UUID)  

**الحقول:**
- `id` - UUID (Primary Key)
- `name` - TEXT (NOT NULL)
- `name_ar` - TEXT
- `description` - TEXT
- `price` - DECIMAL(10, 2) (NOT NULL)
- `duration_days` - INTEGER (NOT NULL)
- `features` - JSONB
- `max_products` - INTEGER
- `is_active` - BOOLEAN DEFAULT true
- `display_order` - INTEGER DEFAULT 0
- `created_at` - TIMESTAMPTZ

**الفهارس:**
- `idx_packages_is_active` - على `is_active`

**البيانات الأولية:**
- Free (مجانية) - 30 يوم، 10 منتجات
- Basic (أساسية) - 99 ر.س، 50 منتج
- Professional (احترافية) - 299 ر.س، 200 منتج
- Enterprise (مؤسسية) - 999 ر.س، 1000 منتج

---

### 25. 📋 `package_subscriptions` - اشتراكات الباقات

**الوصف:** اشتراكات المتاجر في الباقات  
**المفاتيح الأساسية:** `id` (UUID)  
**العلاقات:**
- `store_id` → `stores(id)` (ON DELETE CASCADE)
- `package_id` → `packages(id)` (ON DELETE CASCADE)

**الحقول:**
- `id` - UUID (Primary Key)
- `store_id` - UUID (Foreign Key → stores, NOT NULL)
- `package_id` - UUID (Foreign Key → packages, NOT NULL)
- `starts_at` - TIMESTAMPTZ (NOT NULL)
- `expires_at` - TIMESTAMPTZ (NOT NULL)
- `is_active` - BOOLEAN DEFAULT true
- `payment_id` - UUID
- `auto_renew` - BOOLEAN DEFAULT false
- `created_at` - TIMESTAMPTZ

**الفهارس:**
- `idx_package_subscriptions_store_id` - على `store_id`
- `idx_package_subscriptions_expires_at` - على `expires_at`

---

## 🔍 العلاقات والاعتمادية

### Chain 1: User → Store → Product
```
auth.users
  ↓ (1:1)
user_profiles
  ↓ (1:N)
stores
  ↓ (1:N)
products
```

### Chain 2: User → Cart → Order
```
user_profiles
  ↓ (1:1)
carts
  ↓ (1:N)
cart_items
  ↓ (N:1)
orders
```

### Chain 3: User → Wallet → Transactions
```
user_profiles
  ↓ (1:N)
wallets
  ↓ (1:N)
wallet_transactions
```

### Chain 4: User → Points → Transactions
```
user_profiles
  ↓ (1:N)
points_accounts
  ↓ (1:N)
points_transactions
```

---

## ⚠️ المشاكل المحتملة

### 1. **حقل `stock` vs `stock_quantity`**
- في `products`: يستخدم `stock` (INTEGER)
- في `DATABASE_FUNCTIONS.sql`: يستخدم `stock_quantity`
- **الحل:** توحيد الاستخدام على `stock`

### 2. **`conversations.merchant_id`**
- يشير إلى `stores` وليس `user_profiles`
- **الحل المحتمل:** تغيير إلى `owner_id` من `stores`

### 3. **RLS Policies**
- معطل حالياً (ملاحظة في الملف)
- **مطلوب:** تفعيل RLS في الإنتاج

### 4. **Missing Tables**
- لا يوجد جدول `wishlist` (مطلوب للميزة الجديدة)
- لا يوجد جدول `recently_viewed` (مطلوب للميزة الجديدة)
- لا يوجد جدول `product_variants` (مطلوب للميزة الجديدة)

---

## ✅ نقاط القوة

1. ✅ بنية واضحة ومنظمة
2. ✅ استخدام UUIDs بشكل صحيح
3. ✅ فهارس جيدة على الحقول المهمة
4. ✅ دعم JSONB للبيانات المرنة
5. ✅ نظام Snapshots في `order_items`
6. ✅ دعم الفئات الهرمية
7. ✅ نظام محافظ ونقاط متكامل

---

## 📝 التوصيات

1. **إضافة الجداول المفقودة:**
   - `wishlist`
   - `recently_viewed`
   - `product_variants`

2. **تصحيح المشاكل:**
   - توحيد `stock` / `stock_quantity`
   - مراجعة `conversations.merchant_id`

3. **تفعيل RLS:**
   - إنشاء policies للجداول الحساسة

4. **إضافة Constraints:**
   - CHECK constraints للحقول المهمة (مثل `price > 0`)

---

**تم التحليل:** يناير 2025  
**الإصدار:** 1.0

