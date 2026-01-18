# 🛒 MBUY Customer - تطبيق العميل

<div align="center">

![MBUY Logo](https://via.placeholder.com/200x80?text=MBUY)

**تطبيق التسوق للعملاء - منصة MBUY**

[![Flutter](https://img.shields.io/badge/Flutter-3.10.0+-02569B?style=for-the-badge&logo=flutter)](https://flutter.dev)
[![Dart](https://img.shields.io/badge/Dart-3.0+-0175C2?style=for-the-badge&logo=dart)](https://dart.dev)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-F38020?style=for-the-badge&logo=cloudflare)](https://workers.cloudflare.com)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)

</div>

---

## 📋 فهرس المحتويات

- [نظرة عامة](#-نظرة-عامة)
- [الميزات](#-الميزات)
- [البنية التقنية](#-البنية-التقنية)
- [API Endpoints](#-api-endpoints)
- [التثبيت](#-التثبيت)
- [التشغيل](#-التشغيل)

---

## 🎯 نظرة عامة

**MBUY Customer** هو تطبيق تسوق للعملاء يتيح تصفح المتاجر والمنتجات، إدارة السلة والمفضلة، وإتمام عمليات الشراء.

### الميزات الرئيسية

- 🛍️ **تصفح المنتجات** - بحث وتصنيفات متقدمة
- 🛒 **سلة التسوق** - إضافة، تعديل، حذف
- ❤️ **المفضلة** - حفظ المنتجات المفضلة
- 📦 **الطلبات** - إنشاء ومتابعة الطلبات
- 📍 **العناوين** - إدارة عناوين التوصيل
- 🔐 **المصادقة** - تسجيل دخول آمن

---

## ✨ الميزات

### 🛍️ تصفح المنتجات
- عرض جميع المنتجات
- المنتجات الرائجة
- عروض الفلاش
- البحث المتقدم
- التصنيفات

### 🛒 سلة التسوق
- إضافة منتجات للسلة
- تعديل الكميات
- حذف العناصر
- عرض المجموع

### ❤️ المفضلة
- إضافة للمفضلة
- حذف من المفضلة
- عرض قائمة المفضلة

### 📦 الطلبات
- إنشاء طلب جديد
- عرض طلباتي
- تتبع حالة الطلب
- إلغاء الطلبات

### 📍 العناوين
- إضافة عنوان جديد
- تعديل العناوين
- حذف العناوين
- تعيين العنوان الافتراضي

---

## 🔌 API Endpoints

### Base URL
```
https://misty-mode-b68b.baharista1.workers.dev
```

### Public Endpoints (بدون مصادقة)

| Endpoint | الوصف |
|----------|-------|
| `GET /api/public/products` | قائمة المنتجات |
| `GET /api/public/products/:id` | تفاصيل منتج |
| `GET /api/public/products/trending` | المنتجات الرائجة |
| `GET /api/public/products/flash-deals` | عروض الفلاش |
| `GET /api/public/stores` | قائمة المتاجر |
| `GET /api/public/stores/featured` | المتاجر المميزة |
| `GET /api/public/platform-categories` | أقسام المنصة |
| `GET /api/public/search/products` | بحث المنتجات |

### Customer Endpoints (تتطلب مصادقة)

#### السلة
| Endpoint | الوصف |
|----------|-------|
| `GET /api/customer/cart` | جلب السلة |
| `POST /api/customer/cart` | إضافة للسلة |
| `PUT /api/customer/cart/:itemId` | تحديث الكمية |
| `DELETE /api/customer/cart/:itemId` | حذف عنصر |
| `DELETE /api/customer/cart` | تفريغ السلة |
| `GET /api/customer/cart/count` | عدد العناصر |

#### المفضلة
| Endpoint | الوصف |
|----------|-------|
| `GET /api/customer/favorites` | جلب المفضلة |
| `POST /api/customer/favorites` | إضافة للمفضلة |
| `DELETE /api/customer/favorites/:productId` | حذف من المفضلة |
| `POST /api/customer/favorites/toggle` | تبديل المفضلة |
| `GET /api/customer/favorites/count` | عدد المفضلة |

#### الدفع والطلبات
| Endpoint | الوصف |
|----------|-------|
| `POST /api/customer/checkout/validate` | التحقق قبل الدفع |
| `POST /api/customer/checkout` | إنشاء طلب |
| `GET /api/customer/checkout/orders` | طلباتي |
| `GET /api/customer/checkout/orders/:id` | تفاصيل طلب |
| `POST /api/customer/checkout/orders/:id/cancel` | إلغاء طلب |

#### العناوين
| Endpoint | الوصف |
|----------|-------|
| `GET /api/customer/addresses` | جلب العناوين |
| `POST /api/customer/addresses` | إضافة عنوان |
| `PUT /api/customer/addresses/:id` | تحديث عنوان |
| `DELETE /api/customer/addresses/:id` | حذف عنوان |
| `PUT /api/customer/addresses/:id/default` | تعيين افتراضي |

---

## 🏗️ البنية التقنية

```
┌─────────────────────────────────────────────────────────────────┐
│                   MBUY Customer App                              │
│   (Flutter + Riverpod + GoRouter)                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Cloudflare Worker                             │
│   (Hono Framework + JWT Auth)                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Supabase                                    │
│   PostgreSQL + Auth + Storage                                    │
└─────────────────────────────────────────────────────────────────┘
```

### التقنيات المستخدمة

| الطبقة | التقنية | الوصف |
|--------|---------|-------|
| **Frontend** | Flutter 3.10+ | تطبيق الموبايل |
| **State** | Riverpod 3.0+ | إدارة الحالة |
| **Navigation** | GoRouter 14+ | التنقل |
| **Backend** | Cloudflare Workers | API Gateway |
| **Database** | Supabase PostgreSQL | قاعدة البيانات |

---

## 📋 المتطلبات

- Flutter SDK >= 3.10.0
- Dart SDK >= 3.0.0
- Android Studio / VS Code
- Android SDK (للـ Android)
- Xcode (للـ iOS)

---

## 🚀 التثبيت

```bash
# Clone the repository
git clone https://github.com/your-repo/mbuy.git
cd mbuy/mbuy_customer

# Install dependencies
flutter pub get

# Run the app
flutter run
```

---

## 📁 هيكل المشروع

```bash
cd saleh

# تثبيت الـ dependencies
flutter pub get

# تشغيل التطبيق
flutter run
```

### 3. إعداد Cloudflare Worker

```bash
cd mbuy-worker

# تثبيت الـ dependencies
npm install

# إعداد المتغيرات
cp .env.example .env
# قم بتعديل المتغيرات في .env

# تشغيل محلياً
npm run dev

# النشر
npm run deploy
```

### 4. إعداد Supabase

1. أنشئ مشروع جديد في [Supabase](https://supabase.com)
2. انسخ الـ URL و Keys
3. قم بتشغيل migrations من مجلد `supabase/migrations`

---

## 📁 هيكل المشروع

### Flutter App (`saleh/`)

```
lib/
├── main.dart                    # نقطة الدخول
├── apps/
│   ├── customer/               # تطبيق العميل (CustomerApp)
│   │   ├── core/
│   │   │   └── theme/          # الثيم (Light/Dark)
│   │   │       ├── app_theme.dart
│   │   │       └── theme_provider.dart
│   │   ├── data/
│   │   │   ├── repositories/   # Repository Pattern
│   │   │   │   ├── base_repository.dart
│   │   │   │   ├── product_repository.dart
│   │   │   │   ├── cart_repository.dart
│   │   │   │   ├── store_repository.dart
│   │   │   │   └── category_repository.dart
│   │   │   ├── customer_api_service.dart
│   │   │   └── customer_providers.dart
│   │   ├── features/
│   │   │   ├── home/           # الصفحة الرئيسية
│   │   │   ├── cart/           # سلة التسوق
│   │   │   ├── favorites/      # المفضلة
│   │   │   ├── search/         # البحث
│   │   │   ├── categories/     # الفئات
│   │   │   ├── store/          # صفحة المتجر
│   │   │   └── product/        # تفاصيل المنتج
│   │   ├── widgets/
│   │   │   ├── state_widgets.dart  # Loading/Error/Empty
│   │   │   ├── cached_image.dart   # تخزين الصور
│   │   │   └── app_header.dart
│   │   ├── routes/
│   │   │   └── customer_router.dart
│   │   └── customer_app.dart
│   │
│   └── merchant/               # تطبيق التاجر
│       ├── features/           # ميزات خاصة
│       │   ├── delivery/       # خيارات التوصيل
│       │   ├── payments/       # طرق الدفع
│       │   ├── shipping/       # الشحن
│       │   ├── webstore/       # المتجر الإلكتروني
│       │   ├── whatsapp/       # تكامل واتساب
│       │   └── qrcode/         # مولد QR
│       ├── routes/             # Router خاص
│       └── merchant_app.dart
├── core/
│   ├── app_config.dart         # إعدادات API
│   ├── constants/              # الثوابت
│   ├── controllers/            # Controllers
│   ├── l10n/                   # الترجمة
│   ├── router/                 # GoRouter
│   ├── services/               # الخدمات
│   └── theme/                  # الثيم
├── features/
│   ├── auth/                   # المصادقة
│   ├── dashboard/              # لوحة التحكم
│   ├── products/               # المنتجات
│   ├── marketing/              # التسويق
│   ├── ai_studio/              # استوديو AI
│   ├── conversations/          # المحادثات
│   ├── merchant/               # ميزات التاجر
│   └── community/              # المجتمع
└── shared/
    ├── widgets/                # الويدجتس المشتركة
    ├── screens/                # الشاشات المشتركة
    └── utils/                  # الأدوات
```

### Cloudflare Worker (`mbuy-worker/`)

```
src/
├── index.ts                    # نقطة الدخول
├── types.ts                    # TypeScript Types
├── endpoints/                  # API Endpoints
│   ├── supabaseAuth.ts         # المصادقة
│   ├── store.ts                # المتجر
│   ├── products.ts             # المنتجات
│   ├── coupons.ts              # الكوبونات
│   ├── flash-sales.ts          # العروض الخاطفة
│   ├── analytics.ts            # التحليلات
│   ├── ai.ts                   # AI
│   └── ...                     # المزيد
├── routes/                     # Route Modules
│   ├── public.ts               # المسارات العامة
│   ├── auth.ts                 # مسارات المصادقة
│   ├── merchant.ts             # مسارات التاجر
│   ├── marketing.ts            # مسارات التسويق
│   ├── ai.ts                   # مسارات AI
│   └── ...                     # المزيد
├── middleware/                 # Middleware
│   ├── supabaseAuthMiddleware.ts
│   ├── rateLimiter.ts
│   └── errorHandler.ts
├── utils/                      # Utilities
│   ├── supabase.ts
│   └── logging.ts
└── durable-objects/            # Durable Objects
```

---

## 🔧 التشغيل

### Development Mode

```bash
# Flutter App
cd saleh
flutter run

# Cloudflare Worker
cd mbuy-worker
npm run dev
```

### Production Build

```bash
# Flutter App
flutter build apk --release    # Android
flutter build ios --release    # iOS

# Cloudflare Worker
npm run deploy
```

---

## 📚 API Documentation

### Base URL
```
https://your-worker.workers.dev
```

### Authentication
جميع المسارات الآمنة تتطلب Bearer Token:
```
Authorization: Bearer <access_token>
```

### Endpoints الرئيسية

#### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/supabase/register` | تسجيل حساب جديد |
| POST | `/auth/supabase/login` | تسجيل الدخول |
| POST | `/auth/supabase/logout` | تسجيل الخروج |
| POST | `/auth/supabase/refresh` | تجديد Token |

#### Merchant
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/secure/merchant/store` | جلب بيانات المتجر |
| POST | `/secure/merchant/store` | إنشاء متجر |
| GET | `/secure/merchant/products` | جلب المنتجات |
| POST | `/secure/merchant/products` | إضافة منتج |

#### Marketing
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/secure/marketing/coupons` | جلب الكوبونات |
| POST | `/secure/marketing/coupons` | إنشاء كوبون |
| GET | `/secure/marketing/flash-sales` | جلب العروض الخاطفة |
| POST | `/secure/marketing/flash-sales` | إنشاء عرض |

[راجع التوثيق الكامل للـ API](./docs/API.md)

---

## ⚙️ الإعدادات

### Flutter App (`lib/core/app_config.dart`)

```dart
class AppConfig {
  static const String apiBaseUrl = 'https://your-worker.workers.dev';
  static const String appName = 'MBUY Merchant';
  static const String appVersion = '1.0.0';
}
```

### Cloudflare Worker (`.env`)

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
EDGE_INTERNAL_KEY=your-internal-key
```

---

## 🏛️ البنية البرمجية

### Repository Pattern

تستخدم طبقة البيانات نمط Repository لفصل منطق البيانات عن واجهة المستخدم:

```dart
// Result Pattern للتعامل مع النجاح والفشل
sealed class Result<T> {
  factory Result.success(T data) = Success<T>;
  factory Result.failure(String message) = Failure<T>;
}

// استخدام Repository
final result = await productRepository.getProducts();
result.fold(
  onSuccess: (products) => // عرض المنتجات,
  onFailure: (message, code) => // عرض الخطأ,
);
```

### State Widgets

مكونات جاهزة للحالات المختلفة:
- `LoadingWidget` / `ShimmerLoadingWidget` - حالة التحميل
- `AppErrorWidget` / `NetworkErrorWidget` - حالات الأخطاء
- `EmptyStateWidget` / `EmptyCartWidget` - حالات الفراغ
- `AsyncValueBuilder` - بناء واجهات Riverpod

### Theme System

دعم كامل للوضع الفاتح والداكن مع حفظ التفضيل:

```dart
// تبديل الوضع
ref.read(themeProvider.notifier).toggleTheme();

// استخدام System Theme
ref.read(themeProvider.notifier).useSystemTheme();
```

---

## 🤝 المساهمة

نرحب بالمساهمات! يرجى اتباع الخطوات التالية:

1. Fork المشروع
2. أنشئ branch جديد (`git checkout -b feature/amazing-feature`)
3. Commit التغييرات (`git commit -m 'Add amazing feature'`)
4. Push إلى Branch (`git push origin feature/amazing-feature`)
5. افتح Pull Request

---

## 📄 الرخصة

هذا المشروع مرخص تحت [MIT License](LICENSE)

---

## 📞 التواصل

- **البريد الإلكتروني**: support@mbuy.sa
- **الموقع**: [www.mbuy.sa](https://www.mbuy.sa)

---

<div align="center">

**صُنع بـ ❤️ في السعودية**

© 2025-2026 MBUY. جميع الحقوق محفوظة.

</div>
