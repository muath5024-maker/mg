# 🚀 خطة تنفيذ البنية الأساسية - MBUY

## 📊 الحالة الحالية

### ✅ موجود:
- Products (merchant)
- Orders 
- Wallet
- Points
- Coupons
- Favorites
- Stories
- Banners

### ❌ مفقود (يحتاج إنشاء كامل):
1. **Wishlist** - يحتاج UI + Route + Service
2. **Product Variants** - يحتاج UI + Route + Service
3. **Bulk Operations** - يحتاج UI + Route + Service
4. **Recently Viewed** - يحتاج UI + Route + Service

---

## 🎯 خطة التنفيذ المرحلية

### المرحلة 1: Customer Features المفقودة (الأولوية)
1. Wishlist - كامل (UI + Route + Service)
2. Recently Viewed - كامل (UI + Route + Service)

### المرحلة 2: Product Management المفقود
1. Product Variants - كامل (UI + Route + Service)
2. Bulk Operations - كامل (UI + Route + Service)
3. Product Attributes - Structure فقط
4. Product Bundles - Structure فقط
5. SKU Management - Enhancement

### المرحلة 3: Store Management
1. Store Settings - Structure
2. Staff & Roles - Structure
3. Analytics - موجود، يحتاج enhancement

### المرحلة 4: Order Management
1. Returns/Refunds - Structure
2. Shipping - Enhancement

### المرحلة 5: Payment Features
1. BNPL Support - Structure
2. Saved Cards - Structure

### المرحلة 6: Advanced Features
1. AI Recommendations - Structure
2. Fraud Detection - Structure
3. Automation - Structure

---

## 📁 الهيكل المقترح

```
lib/features/
├── customer/
│   ├── data/
│   │   ├── models/
│   │   │   ├── wishlist_model.dart ✨ جديد
│   │   │   └── recently_viewed_model.dart ✨ جديد
│   │   └── services/
│   │       ├── wishlist_service.dart ✨ جديد
│   │       └── recently_viewed_service.dart ✨ جديد
│   └── presentation/
│       └── screens/
│           ├── wishlist_screen.dart ✨ جديد
│           └── recently_viewed_screen.dart ✨ جديد
├── merchant/
│   ├── data/
│   │   ├── models/
│   │   │   ├── product_variant_model.dart ✨ جديد
│   │   │   ├── product_attribute_model.dart ✨ جديد
│   │   │   └── product_bundle_model.dart ✨ جديد
│   │   └── services/
│   │       ├── product_variant_service.dart ✨ جديد
│   │       ├── bulk_operations_service.dart ✨ جديد
│   │       └── store_settings_service.dart ✨ جديد
│   └── presentation/
│       └── screens/
│           ├── product_variants_screen.dart ✨ جديد
│           └── bulk_operations_screen.dart ✨ جديد
└── shared/
    └── models/
        ├── order_return_model.dart ✨ جديد
        └── bnpl_model.dart ✨ جديد
```

---

## ⏱️ الوقت المتوقع

- المرحلة 1: 2-3 ساعات
- المرحلة 2: 4-5 ساعات
- المرحلة 3-6: 3-4 ساعات

**الإجمالي:** 9-12 ساعة

---

**سيتم التنفيذ الآن بشكل تدريجي.**

