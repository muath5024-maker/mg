# 🛒 MBUY Platform - منصة MBUY للتجارة الإلكترونية

<div align="center">

![MBUY Logo](https://via.placeholder.com/300x100?text=MBUY+Platform)

**منصة تجارة إلكترونية متكاملة تربط التجار بالعملاء**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![Flutter](https://img.shields.io/badge/Flutter-3.10.0+-02569B?style=for-the-badge&logo=flutter)](https://flutter.dev)
[![GraphQL](https://img.shields.io/badge/GraphQL-E10098?style=for-the-badge&logo=graphql)](https://graphql.org)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-F38020?style=for-the-badge&logo=cloudflare)](https://workers.cloudflare.com)

</div>

---

## 📋 فهرس المحتويات

- [نظرة عامة على المنصة](#-نظرة-عامة-على-المنصة)
- [بنية النظام](#-بنية-النظام)
- [المشاريع](#-المشاريع)
  - [1. MBUY Worker (Backend)](#1--mbuy-worker---الـ-backend)
  - [2. MBUY Merchant (تطبيق التاجر)](#2--mbuy-merchant---تطبيق-التاجر)
  - [3. MBUY Customer (تطبيق العميل)](#3--mbuy-customer---تطبيق-العميل)
- [البدء السريع](#-البدء-السريع)
- [المساهمة](#-المساهمة)

---

## 🎯 نظرة عامة على المنصة

**MBUY** هي منصة تجارة إلكترونية متكاملة. لفهم كيف تعمل المنصة، إليك الشرح المبسط:

### 🧠 الفكرة الأساسية

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                        🎯 كيف تعمل منصة MBUY؟                               │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    📱 الواجهات (Frontends)                          │   │
│  │                                                                      │   │
│  │   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐              │   │
│  │   │  تطبيق      │   │  تطبيق      │   │  لوحة       │   + أي       │   │
│  │   │  العميل     │   │  التاجر     │   │  الإدارة    │   واجهة     │   │
│  │   │  (Flutter)  │   │  (Flutter)  │   │  (Next.js)  │   مستقبلية  │   │
│  │   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘              │   │
│  │          │                 │                 │                      │   │
│  └──────────┼─────────────────┼─────────────────┼──────────────────────┘   │
│             │                 │                 │                          │
│             │    ┌────────────▼────────────┐    │                          │
│             │    │      GraphQL API        │    │                          │
│             └────►                         ◄────┘                          │
│                  └────────────┬────────────┘                               │
│                               │                                            │
│  ┌────────────────────────────▼────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │                   ⚡ MBUY Worker (Backend)                           │   │
│  │                   ═══════════════════════                            │   │
│  │                                                                      │   │
│  │   هذا هو "المخ" الوحيد في النظام                                     │   │
│  │                                                                      │   │
│  │   ✅ يستقبل جميع الطلبات من كل الواجهات                              │   │
│  │   ✅ يعالج البيانات والمنطق التجاري                                   │   │
│  │   ✅ هو الوحيد الذي يتواصل مع قاعدة البيانات                          │   │
│  │   ✅ يدير المصادقة والصلاحيات                                         │   │
│  │                                                                      │   │
│  └────────────────────────────┬─────────────────────────────────────────┘   │
│                               │                                            │
│                               │  (الاتصال الوحيد بقاعدة البيانات)          │
│                               ▼                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │                   🗄️ Supabase (قاعدة البيانات)                       │   │
│  │                   ════════════════════════════                        │   │
│  │                                                                      │   │
│  │   ⚠️ ملاحظة مهمة: Supabase هنا مجرد قاعدة بيانات PostgreSQL         │   │
│  │                                                                      │   │
│  │   • تخزين بيانات المستخدمين (العملاء والتجار)                        │   │
│  │   • تخزين المنتجات والطلبات                                          │   │
│  │   • تخزين جميع بيانات المنصة                                         │   │
│  │   • لا يتم الوصول إليها مباشرة من الواجهات أبداً!                     │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### ⚠️ نقاط مهمة جداً للفهم

| ❌ خطأ شائع | ✅ الصحيح |
|------------|----------|
| Supabase هي Backend | **Supabase مجرد قاعدة بيانات PostgreSQL** |
| التطبيقات تتصل بـ Supabase مباشرة | **التطبيقات تتصل فقط بـ Worker** |
| كل تطبيق له Backend خاص | **Worker واحد يخدم جميع الواجهات** |

### 🔄 تدفق البيانات (Data Flow)

```
مثال: عميل يريد عرض المنتجات
═════════════════════════════

1️⃣  تطبيق العميل ──────► يرسل طلب GraphQL ──────► MBUY Worker
    
2️⃣  MBUY Worker ──────► يقرأ من قاعدة البيانات ──────► Supabase
    
3️⃣  Supabase ──────► يرجع البيانات ──────► MBUY Worker
    
4️⃣  MBUY Worker ──────► يرسل الاستجابة ──────► تطبيق العميل
```

```
مثال: تاجر يضيف منتج جديد
═════════════════════════

1️⃣  تطبيق التاجر ──────► يرسل Mutation ──────► MBUY Worker

2️⃣  MBUY Worker ──────► يتحقق من الصلاحيات
                  ──────► يحفظ في قاعدة البيانات ──────► Supabase

3️⃣  Supabase ──────► يؤكد الحفظ ──────► MBUY Worker

4️⃣  MBUY Worker ──────► يرسل تأكيد النجاح ──────► تطبيق التاجر
```

### 🏗️ لماذا هذه البنية؟

| الميزة | الشرح |
|--------|-------|
| **🔒 الأمان** | قاعدة البيانات محمية - لا يمكن الوصول إليها مباشرة |
| **🎯 التحكم المركزي** | كل المنطق التجاري في مكان واحد (Worker) |
| **📈 قابلية التوسع** | إضافة واجهات جديدة سهل - فقط تتصل بالـ Worker |
| **🛠️ سهولة الصيانة** | تعديل واحد في Worker يؤثر على كل الواجهات |
| **🔄 التناسق** | نفس القواعد والصلاحيات لكل الواجهات |

### 📦 مكونات المنصة

| المكون | النوع | الوظيفة | يتصل بـ |
|--------|-------|---------|---------|
| **MBUY Worker** | Backend | معالجة كل الطلبات والمنطق التجاري | Supabase (قاعدة البيانات) |
| **تطبيق العميل** | Frontend | واجهة تسوق للعملاء | Worker فقط |
| **تطبيق التاجر** | Frontend | واجهة إدارة للتجار | Worker فقط |
| **لوحة الإدارة** | Frontend | واجهة للمشرفين (مستقبلاً) | Worker فقط |
| **Supabase** | Database | تخزين جميع البيانات | Worker فقط (لا أحد غيره) |

### 🛠️ التقنيات المستخدمة

| الطبقة | التقنية | الشرح |
|--------|---------|-------|
| **Backend** | Cloudflare Worker + Hono.js | الخادم الرئيسي |
| **API** | GraphQL (Yoga Server) | طريقة التواصل بين الواجهات والـ Backend |
| **ORM** | Drizzle ORM | للتعامل مع قاعدة البيانات |
| **Database** | Supabase (PostgreSQL) | قاعدة البيانات |
| **Storage** | Cloudflare R2 | تخزين الصور والملفات |
| **Mobile Apps** | Flutter + Riverpod 3.x | تطبيقات الموبايل |
| **Navigation** | Go Router | التنقل في التطبيقات |

---

## 🏗️ بنية النظام

```
muath/
├── 📁 mbuy-worker/          # ⚡ Backend API (Cloudflare Worker)
│   ├── src/
│   │   ├── index.ts         # Entry point
│   │   ├── graphql/         # GraphQL Schema & Resolvers
│   │   ├── db/              # Drizzle ORM Schema
│   │   ├── routes/          # REST Routes (legacy)
│   │   └── middleware/      # Auth, Rate Limiting
│   └── wrangler.jsonc
│
├── 📁 mbuy_merchant/        # 🏪 تطبيق التاجر (Flutter)
│   ├── lib/
│   │   ├── core/graphql/    # GraphQL Client
│   │   ├── data/            # Repositories
│   │   ├── providers/       # Riverpod Providers
│   │   └── features/        # UI Screens
│   └── pubspec.yaml
│
└── 📁 mbuy_customer/        # 🛒 تطبيق العميل (Flutter)
    ├── lib/
    │   ├── core/graphql/    # GraphQL Client
    │   ├── data/            # Repositories
    │   ├── providers/       # Riverpod Providers
    │   └── features/        # UI Screens
    └── pubspec.yaml
```

---

# 📁 المشاريع

---

# 1. ⚡ MBUY Worker - الـ Backend

<div align="center">

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Hono](https://img.shields.io/badge/Hono-4.6+-E36002?style=flat-square)](https://hono.dev)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-F38020?style=flat-square&logo=cloudflare)](https://workers.cloudflare.com)

</div>

## 🎯 نظرة عامة

**MBUY Worker** هو الـ API Gateway الرئيسي للمنصة، يعمل على Cloudflare Workers ويوفر:

- 🔐 المصادقة وإدارة الجلسات (JWT + Supabase)
- 📊 GraphQL API موحد
- 📦 إدارة المنتجات والمخزون
- 🛒 معالجة الطلبات
- 📈 التحليلات والتقارير
- 🤖 خدمات AI
- 📁 رفع وتقديم الوسائط (R2)

## 🏗️ هيكل المشروع

```
mbuy-worker/
├── src/
│   ├── index.ts                    # Entry Point & Main Router
│   ├── types.ts                    # TypeScript Definitions
│   │
│   ├── graphql/                    # GraphQL Layer
│   │   ├── schema.ts               # Schema Definitions
│   │   ├── resolvers/              # Query & Mutation Resolvers
│   │   │   ├── auth.resolver.ts
│   │   │   ├── product.resolver.ts
│   │   │   ├── order.resolver.ts
│   │   │   ├── cart.resolver.ts
│   │   │   └── merchant.resolver.ts
│   │   └── types/                  # GraphQL Types
│   │
│   ├── db/                         # Database Layer (Drizzle)
│   │   ├── schema/                 # Table Schemas
│   │   │   ├── users.ts
│   │   │   ├── products.ts
│   │   │   ├── orders.ts
│   │   │   └── ...
│   │   ├── relations.ts            # Table Relations
│   │   └── index.ts                # DB Client
│   │
│   ├── routes/                     # REST Routes (Legacy)
│   │   ├── public.ts
│   │   ├── auth.ts
│   │   ├── merchant.ts
│   │   └── customer.ts
│   │
│   ├── middleware/                 # Request Middleware
│   │   ├── supabaseAuthMiddleware.ts
│   │   ├── rateLimiter.ts
│   │   ├── requestLogger.ts
│   │   └── errorHandler.ts
│   │
│   └── utils/                      # Utilities
│       ├── supabase.ts
│       └── logging.ts
│
├── migrations/                     # Database Migrations
├── wrangler.jsonc                  # Cloudflare Config
└── package.json
```

## 🚀 التثبيت والتشغيل

```bash
# الانتقال للمجلد
cd mbuy-worker

# تثبيت التبعيات
npm install

# إعداد المتغيرات البيئية
cp .env.example .env
# قم بتعديل .env بالقيم الصحيحة

# التشغيل محلياً
npm run dev

# النشر
npm run deploy
```

## 📚 GraphQL API

### Endpoint
```
POST /graphql
```

### Authentication Queries
```graphql
mutation Login($email: String!, $password: String!) {
  login(email: $email, password: $password) {
    accessToken
    refreshToken
    user { id email role }
  }
}

mutation Register($input: RegisterInput!) {
  register(input: $input) {
    accessToken
    user { id email }
  }
}
```

### Product Queries
```graphql
query GetProducts($first: Int, $after: String, $filter: ProductFilter) {
  products(first: $first, after: $after, filter: $filter) {
    edges {
      node { id name price images }
    }
    pageInfo { hasNextPage endCursor }
  }
}

mutation CreateProduct($input: CreateProductInput!) {
  createProduct(input: $input) {
    id name sku price
  }
}
```

### Order Queries
```graphql
query GetOrders($status: OrderStatus) {
  orders(status: $status) {
    id
    status
    total
    items { product { name } quantity price }
  }
}

mutation UpdateOrderStatus($orderId: ID!, $status: OrderStatus!) {
  updateOrderStatus(orderId: $orderId, status: $status) {
    id status
  }
}
```

## 🔒 Middleware

| Middleware | الوظيفة |
|------------|---------|
| `supabaseAuthMiddleware` | التحقق من JWT Token |
| `rateLimiter` | الحد من عدد الطلبات |
| `errorHandler` | معالجة الأخطاء |
| `requestLogger` | تسجيل الطلبات |

## ⚙️ Environment Variables

| Variable | الوصف |
|----------|-------|
| `DATABASE_URL` | PostgreSQL connection string |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `JWT_SECRET` | JWT signing secret |
| `R2_PUBLIC_URL` | R2 bucket public URL |

---

# 2. 🏪 MBUY Merchant - تطبيق التاجر

<div align="center">

[![Flutter](https://img.shields.io/badge/Flutter-3.10.0+-02569B?style=flat-square&logo=flutter)](https://flutter.dev)
[![Dart](https://img.shields.io/badge/Dart-3.0+-0175C2?style=flat-square&logo=dart)](https://dart.dev)
[![Riverpod](https://img.shields.io/badge/Riverpod-3.0+-00D1B2?style=flat-square)](https://riverpod.dev)

</div>

## 🎯 نظرة عامة

**MBUY Merchant** هو تطبيق إدارة متجر شامل للتجار يتيح:

- 📊 **لوحة التحكم** - إحصائيات وتحليلات شاملة
- 📦 **إدارة المنتجات** - إضافة، تعديل، حذف المنتجات
- 🛒 **إدارة الطلبات** - متابعة ومعالجة الطلبات
- 👥 **إدارة العملاء** - عرض بيانات العملاء
- 💰 **التقارير المالية** - المبيعات والأرباح
- ⚙️ **إعدادات المتجر** - تخصيص المتجر

## ✨ الميزات

### 📊 لوحة التحكم (Dashboard)
- إحصائيات اليوم/الأسبوع/الشهر
- مخطط المبيعات
- الطلبات الجديدة
- المنتجات الأكثر مبيعاً
- تنبيهات المخزون المنخفض

### 📦 إدارة المنتجات
- إضافة منتجات جديدة
- تعديل المنتجات الحالية
- إدارة المتغيرات (الألوان، المقاسات)
- رفع الصور
- إدارة المخزون
- تفعيل/إلغاء المنتجات

### 🛒 إدارة الطلبات
- عرض الطلبات الجديدة
- تحديث حالة الطلب
- طباعة فواتير الطلبات
- تعيين التوصيل
- إلغاء الطلبات

## 🏗️ هيكل المشروع

```
mbuy_merchant/
├── lib/
│   ├── main.dart
│   │
│   ├── core/
│   │   ├── graphql/
│   │   │   ├── graphql_config.dart    # GraphQL Client Setup
│   │   │   ├── queries.dart           # GraphQL Queries
│   │   │   └── mutations.dart         # GraphQL Mutations
│   │   └── theme/
│   │       └── alibaba_theme.dart     # App Theme
│   │
│   ├── data/
│   │   └── repositories/
│   │       ├── auth_repository.dart
│   │       ├── merchant_repository.dart
│   │       ├── product_repository.dart
│   │       └── order_repository.dart
│   │
│   ├── providers/                      # Riverpod 3.x Providers
│   │   ├── repository_providers.dart
│   │   ├── auth_providers.dart
│   │   ├── dashboard_providers.dart
│   │   ├── product_providers.dart
│   │   └── order_providers.dart
│   │
│   └── features/
│       ├── auth/
│       ├── dashboard/
│       ├── products/
│       ├── orders/
│       └── settings/
│
├── pubspec.yaml
└── README.md
```

## 🚀 التثبيت والتشغيل

```bash
# الانتقال للمجلد
cd mbuy_merchant

# تثبيت التبعيات
flutter pub get

# التشغيل
flutter run

# Build للإنتاج
flutter build apk --release      # Android
flutter build ios --release      # iOS
```

## 📦 State Management (Riverpod 3.x)

```dart
/// Repository Provider
final merchantRepositoryProvider = Provider<MerchantRepository>((ref) {
  return MerchantRepository();
});

/// Dashboard Stats Provider
final dashboardStatsProvider = FutureProvider.family<DashboardStats, DashboardParams>(
  (ref, params) async {
    final repo = ref.watch(merchantRepositoryProvider);
    return repo.getDashboardStats(
      merchantId: params.merchantId,
      startDate: params.startDate,
      endDate: params.endDate,
    );
  },
);

/// Orders Provider with AsyncNotifier
class OrdersNotifier extends AsyncNotifier<List<Order>> {
  @override
  Future<List<Order>> build() async {
    final repo = ref.watch(orderRepositoryProvider);
    return repo.getOrders();
  }
  
  Future<void> updateStatus(String orderId, OrderStatus status) async {
    await ref.read(orderRepositoryProvider).updateOrderStatus(orderId, status);
    ref.invalidateSelf();
  }
}

final ordersProvider = AsyncNotifierProvider<OrdersNotifier, List<Order>>(
  OrdersNotifier.new,
);
```

## 🔌 GraphQL Integration

```dart
class MerchantRepository {
  final GraphQLClient _client = GraphQLConfig.getClient();
  
  Future<DashboardStats> getDashboardStats({
    required String merchantId,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    final result = await _client.query(
      QueryOptions(
        document: gql(MerchantQueries.getDashboard),
        variables: {
          'merchantId': merchantId,
          'startDate': startDate?.toIso8601String(),
          'endDate': endDate?.toIso8601String(),
        },
      ),
    );
    
    if (result.hasException) {
      throw result.exception!;
    }
    
    return DashboardStats.fromJson(result.data!['merchantDashboard']);
  }
}
```

## 🎨 Theme (Alibaba Style)

```dart
class AlibabaTheme {
  // Primary Colors
  static const Color primary = Color(0xFFFF6A00);      // Orange
  static const Color secondary = Color(0xFFFFE4CC);    // Light Orange
  
  // Status Colors
  static const Color success = Color(0xFF52C41A);
  static const Color warning = Color(0xFFFAAD14);
  static const Color error = Color(0xFFFF4D4F);
}
```

---

# 3. 🛒 MBUY Customer - تطبيق العميل

<div align="center">

[![Flutter](https://img.shields.io/badge/Flutter-3.10.0+-02569B?style=flat-square&logo=flutter)](https://flutter.dev)
[![Dart](https://img.shields.io/badge/Dart-3.0+-0175C2?style=flat-square&logo=dart)](https://dart.dev)
[![Riverpod](https://img.shields.io/badge/Riverpod-3.0+-00D1B2?style=flat-square)](https://riverpod.dev)

</div>

## 🎯 نظرة عامة

**MBUY Customer** هو تطبيق تسوق للعملاء يتيح:

- 🛍️ **تصفح المنتجات** - بحث وتصنيفات متقدمة
- 🛒 **سلة التسوق** - إضافة، تعديل، حذف
- ❤️ **المفضلة** - حفظ المنتجات المفضلة
- 📦 **الطلبات** - إنشاء ومتابعة الطلبات
- 📍 **العناوين** - إدارة عناوين التوصيل
- 🔐 **المصادقة** - تسجيل دخول آمن

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

## 🏗️ هيكل المشروع

```
mbuy_customer/
├── lib/
│   ├── main.dart
│   │
│   ├── core/
│   │   ├── graphql/
│   │   │   ├── graphql_config.dart
│   │   │   ├── queries.dart
│   │   │   └── mutations.dart
│   │   └── theme/
│   │       └── app_theme.dart
│   │
│   ├── data/
│   │   └── repositories/
│   │       ├── auth_repository.dart
│   │       ├── product_repository.dart
│   │       ├── cart_repository.dart
│   │       └── order_repository.dart
│   │
│   ├── providers/
│   │   ├── repository_providers.dart
│   │   ├── auth_providers.dart
│   │   ├── cart_providers.dart
│   │   └── order_providers.dart
│   │
│   └── features/
│       ├── home/
│       ├── search/
│       ├── cart/
│       ├── favorites/
│       ├── orders/
│       ├── profile/
│       └── product/
│
├── pubspec.yaml
└── README.md
```

## 🚀 التثبيت والتشغيل

```bash
# الانتقال للمجلد
cd mbuy_customer

# تثبيت التبعيات
flutter pub get

# التشغيل
flutter run

# Build للإنتاج
flutter build apk --release      # Android
flutter build ios --release      # iOS
```

## 📦 State Management (Riverpod 3.x)

```dart
/// Cart Provider
final cartProvider = FutureProvider.family<Cart, String>((ref, customerId) async {
  final repo = ref.watch(cartRepositoryProvider);
  return repo.getCart(customerId);
});

/// Add to Cart
final addToCartProvider = FutureProvider.family<void, AddToCartParams>(
  (ref, params) async {
    final repo = ref.watch(cartRepositoryProvider);
    await repo.addToCart(
      customerId: params.customerId,
      productId: params.productId,
      quantity: params.quantity,
      variantId: params.variantId,
    );
    ref.invalidate(cartProvider(params.customerId));
  },
);

/// Orders Provider
class CustomerOrdersNotifier extends AsyncNotifier<List<Order>> {
  @override
  Future<List<Order>> build() async {
    final repo = ref.watch(orderRepositoryProvider);
    return repo.getCustomerOrders();
  }
}

final customerOrdersProvider = AsyncNotifierProvider<CustomerOrdersNotifier, List<Order>>(
  CustomerOrdersNotifier.new,
);
```

## 🔌 GraphQL Queries

```dart
class CustomerQueries {
  static const String getProducts = r'''
    query GetProducts($first: Int, $after: String, $category: String) {
      products(first: $first, after: $after, category: $category) {
        edges {
          node {
            id
            name
            price
            discountPrice
            images
            store { id name }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  ''';
  
  static const String getCart = r'''
    query GetCart($customerId: ID!) {
      cart(customerId: $customerId) {
        id
        items {
          id
          product { id name price images }
          quantity
          variant { id name }
        }
        total
        itemCount
      }
    }
  ''';
}
```

## 🎨 Theme System

دعم كامل للوضع الفاتح والداكن:

```dart
// تبديل الوضع
ref.read(themeProvider.notifier).toggleTheme();

// استخدام System Theme
ref.read(themeProvider.notifier).useSystemTheme();
```

---

## 🚀 البدء السريع

### 1. Clone المشروع
```bash
git clone https://github.com/your-repo/mbuy-platform.git
cd mbuy-platform
```

### 2. إعداد Backend (Worker)
```bash
cd mbuy-worker
npm install
cp .env.example .env
# تعديل .env بالقيم الصحيحة
npm run dev
```

### 3. إعداد تطبيق التاجر
```bash
cd mbuy_merchant
flutter pub get
flutter run
```

### 4. إعداد تطبيق العميل
```bash
cd mbuy_customer
flutter pub get
flutter run
```

---

## 🧪 الاختبارات

### Backend
```bash
cd mbuy-worker
npm test
npm run test:coverage
```

### Flutter Apps
```bash
# تطبيق التاجر
cd mbuy_merchant
flutter test

# تطبيق العميل
cd mbuy_customer
flutter test
```

---

## 📊 Monitoring & Health Check

### Worker Health
```bash
curl https://your-worker.workers.dev/
# Response: { "ok": true, "message": "MBUY API Gateway", "version": "1.0.0" }
```

### GraphQL Playground
```
https://your-worker.workers.dev/graphql
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

© 2025-2026 MBUY Platform. جميع الحقوق محفوظة.

</div>
