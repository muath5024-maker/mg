# 🔗 MBUY API Compatibility Guide
# دليل توافق واجهات برمجة التطبيقات

> **آخر تحديث**: 1 فبراير 2026  
> **الإصدار**: 2.0

---

## 📋 نظرة عامة

هذا الملف يوثق التوافق بين Frontend (Flutter) و Backend (Cloudflare Worker) لضمان عدم وجود تعارضات في الاتصال.

---

## 🔐 نظام المصادقة (Authentication)

### JWT Configuration

| المكون | القيمة |
|--------|--------|
| **Algorithm** | HS256 |
| **Issuer** | `mbuy-worker` |
| **Token Expiry** | 24 ساعة (86400 ثانية) |
| **Refresh Token Expiry** | 30 يوم |
| **Header Format** | `Authorization: Bearer <token>` |

### Token Payload Structure

```json
{
  "sub": "user_id",
  "type": "customer|merchant|admin",
  "merchant_id": "uuid (للتجار فقط)",
  "iat": 1234567890,
  "exp": 1234654290,
  "iss": "mbuy-worker"
}
```

### مسارات المصادقة

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/login` | POST | تسجيل الدخول |
| `/auth/register` | POST | إنشاء حساب جديد |
| `/auth/refresh` | POST | تجديد الـ Token |
| `/auth/logout` | POST | تسجيل الخروج |
| `/auth/me` | GET | بيانات المستخدم الحالي |
| `/auth/forgot-password` | POST | استعادة كلمة المرور |

---

## 🛒 Customer API

### Base Path: `/api/customer/*`

**المتطلبات**: JWT Token مع `type: "customer"`

| Endpoint | Method | Description | Flutter Config |
|----------|--------|-------------|----------------|
| `/cart` | GET | جلب السلة | `cartEndpoint` |
| `/cart` | POST | إضافة للسلة | `cartEndpoint` |
| `/cart/:id` | PUT | تحديث عنصر | `cartEndpoint` |
| `/cart/:id` | DELETE | حذف عنصر | `cartEndpoint` |
| `/cart/count` | GET | عدد العناصر | `cartCountEndpoint` |
| `/favorites` | GET | المفضلة | `favoritesEndpoint` |
| `/favorites` | POST | إضافة للمفضلة | `favoritesEndpoint` |
| `/favorites/:id` | DELETE | إزالة من المفضلة | `favoritesEndpoint` |
| `/favorites/count` | GET | عدد المفضلة | `favoritesCountEndpoint` |
| `/orders` | GET | طلباتي | `ordersEndpoint` |
| `/orders` | POST | إنشاء طلب | `ordersEndpoint` |
| `/checkout/validate` | POST | التحقق من الطلب | `checkoutValidateEndpoint` |
| `/checkout` | POST | إتمام الشراء | `checkoutEndpoint` |
| `/addresses` | GET/POST/PUT/DELETE | العناوين | `addressesEndpoint` |

---

## 🏪 Merchant API

### Base Path: `/secure/merchant/*` & `/api/merchant/*`

**المتطلبات**: JWT Token مع `type: "merchant"` و صلاحيات مناسبة

| Endpoint | Method | Description | Flutter Config |
|----------|--------|-------------|----------------|
| `/store` | GET | بيانات المتجر | `merchantStoreEndpoint` |
| `/store` | PUT | تحديث المتجر | `merchantStoreEndpoint` |
| `/products` | GET | منتجات التاجر | `merchantProductsEndpoint` |
| `/products` | POST | إنشاء منتج | `merchantProductsEndpoint` |
| `/products/:id` | PUT | تحديث منتج | `merchantProductsEndpoint` |
| `/products/:id` | DELETE | حذف منتج | `merchantProductsEndpoint` |
| `/orders` | GET | طلبات المتجر | `merchantOrdersEndpoint` |
| `/orders/:id/status` | PUT | تحديث حالة الطلب | `merchantOrdersEndpoint` |
| `/categories` | GET/POST/PUT/DELETE | الفئات | `merchantCategoriesEndpoint` |
| `/inventory` | GET/PUT | المخزون | `merchantInventoryEndpoint` |
| `/users` | GET/POST/PUT/DELETE | الموظفين | `merchantUsersEndpoint` |
| `/settings` | GET/PUT | الإعدادات | `merchantSettingsEndpoint` |
| `/boost/pricing` | GET | أسعار التعزيز | `merchantBoostPricingEndpoint` |
| `/boost/active` | GET | التعزيزات النشطة | `merchantActiveBoostsEndpoint` |

---

## 🌐 Public API

### Base Path: `/api/public/*`

**المتطلبات**: لا يوجد (متاح للجميع)

| Endpoint | Method | Description | Flutter Config |
|----------|--------|-------------|----------------|
| `/products` | GET | المنتجات العامة | `publicProductsEndpoint` |
| `/products/:id` | GET | تفاصيل منتج | `publicProductsEndpoint` |
| `/stores` | GET | المتاجر | `publicStoresEndpoint` |
| `/stores/featured` | GET | المتاجر المميزة | `featuredStoresEndpoint` |
| `/categories/all` | GET | جميع الفئات | `publicCategoriesEndpoint` |
| `/products/flash-deals` | GET | عروض فلاش | `flashDealsEndpoint` |
| `/products/trending` | GET | الأكثر رواجاً | `trendingProductsEndpoint` |
| `/platform-categories` | GET | فئات المنصة | `platformCategoriesEndpoint` |
| `/boosted-products` | GET | المنتجات المُعزَّزة | `boostedProductsEndpoint` |
| `/search/products` | GET | بحث المنتجات | `searchProductsEndpoint` |
| `/search/stores` | GET | بحث المتاجر | `searchStoresEndpoint` |
| `/search/suggestions` | GET | اقتراحات البحث | `searchSuggestionsEndpoint` |

---

## 📦 Response Format

### نمط الاستجابة الموحد

```json
// Success Response
{
  "ok": true,
  "data": { ... },
  "message": "Success message (optional)"
}

// Error Response
{
  "ok": false,
  "error": "ERROR_CODE",
  "message": "Human readable message"
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Token مفقود أو منتهي |
| `FORBIDDEN` | 403 | لا يوجد صلاحيات |
| `NOT_FOUND` | 404 | المورد غير موجود |
| `VALIDATION_ERROR` | 400 | خطأ في البيانات المرسلة |
| `NO_MERCHANT` | 400 | التاجر غير موجود |
| `DATABASE_ERROR` | 500 | خطأ في قاعدة البيانات |
| `INTERNAL_ERROR` | 500 | خطأ داخلي |

---

## 🗄️ Database Tables Mapping

### Core Tables

| Drizzle Schema | Supabase Table | Status |
|----------------|----------------|--------|
| `merchants` | `merchants` | ✅ متوافق |
| `merchantUsers` | `merchant_users` | ✅ متوافق |
| `customers` | `customers` | ✅ متوافق |
| `products` | `products` | ✅ متوافق |
| `productVariants` | `product_variants` | ✅ متوافق |
| `orders` | `orders` | ✅ متوافق |
| `orderItems` | `order_items` | ✅ متوافق |
| `shoppingCarts` | `shopping_carts` | ✅ متوافق |
| `cartItems` | `cart_items` | ✅ متوافق |
| `wishlists` | `wishlists` | ✅ متوافق |
| `wishlistItems` | `wishlist_items` | ✅ متوافق |
| `categories` | `categories` | ✅ متوافق |
| `addresses` | `customer_addresses` | ✅ متوافق |

---

## ⚙️ Flutter Configuration

### ملف التكوين الرئيسي

**المسار**: `lib/core/app_config.dart`

```dart
class AppConfig {
  // Base URL
  static const String apiBaseUrl = 'https://misty-mode-b68b.baharista1.workers.dev';
  
  // Auth endpoints - تبدأ بـ /auth/
  // Public endpoints - تبدأ بـ /api/public/
  // Customer endpoints - تبدأ بـ /api/customer/
  // Merchant endpoints - تبدأ بـ /secure/merchant/ أو /api/merchant/
}
```

---

## 🔄 Data Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Flutter App   │────▶│ Cloudflare Worker│────▶│    Supabase     │
│  (Frontend)     │◀────│   (Backend)      │◀────│   (Database)    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                       │                        │
        │ HTTP/HTTPS            │ REST API               │ PostgreSQL
        │ JWT Bearer Token      │ Service Role Key       │ RLS Policies
        │                       │                        │
```

---

## ✅ Compatibility Checklist

| Component | Frontend | Backend | Status |
|-----------|----------|---------|--------|
| Auth Flow | `AuthController` | `/auth/*` | ✅ |
| Cart API | `CartRepository` | `/api/customer/cart` | ✅ |
| Orders API | `OrderRepository` | `/api/customer/orders` | ✅ |
| Products API | `ProductRepository` | `/api/public/products` | ✅ |
| Merchant API | `MerchantRepository` | `/secure/merchant/*` | ✅ |
| Search API | `SearchService` | `/api/public/search/*` | ✅ |

---

## 🚨 Known Issues & Notes

1. **Deprecated Routes**: بعض الـ routes القديمة ترجع `410 Gone`
2. **Rate Limiting**: 100 طلب/دقيقة للمستخدم العادي
3. **File Upload**: الحد الأقصى 10 MB لكل ملف
4. **Pagination**: القيمة الافتراضية 20، الحد الأقصى 100

---

## 📞 Support

للإبلاغ عن مشاكل التوافق:
- إنشاء Issue في GitHub
- التواصل مع فريق التطوير
