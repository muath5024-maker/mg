# 🏪 MBUY Merchant - تطبيق التاجر

<div align="center">

![MBUY Logo](https://via.placeholder.com/200x80?text=MBUY+Merchant)

**تطبيق إدارة المتجر للتجار - منصة MBUY**

[![Flutter](https://img.shields.io/badge/Flutter-3.10.0+-02569B?style=for-the-badge&logo=flutter)](https://flutter.dev)
[![Dart](https://img.shields.io/badge/Dart-3.0+-0175C2?style=for-the-badge&logo=dart)](https://dart.dev)
[![GraphQL](https://img.shields.io/badge/GraphQL-E10098?style=for-the-badge&logo=graphql)](https://graphql.org)
[![Riverpod](https://img.shields.io/badge/Riverpod-3.0+-00D1B2?style=for-the-badge)](https://riverpod.dev)

</div>

---

## 📋 فهرس المحتويات

- [نظرة عامة](#-نظرة-عامة)
- [الميزات](#-الميزات)
- [البنية التقنية](#-البنية-التقنية)
- [التثبيت](#-التثبيت)
- [التشغيل](#-التشغيل)
- [هيكل المشروع](#-هيكل-المشروع)
- [State Management](#-state-management)
- [GraphQL API](#-graphql-api)

---

## 🎯 نظرة عامة

**MBUY Merchant** هو تطبيق إدارة متجر شامل للتجار يتيح إدارة المنتجات والطلبات والعملاء والتحليلات من مكان واحد.

### الميزات الرئيسية

- 📊 **لوحة التحكم** - إحصائيات وتحليلات شاملة
- 📦 **إدارة المنتجات** - إضافة، تعديل، حذف المنتجات
- 🛒 **إدارة الطلبات** - متابعة ومعالجة الطلبات
- 👥 **إدارة العملاء** - عرض بيانات العملاء
- 💰 **التقارير المالية** - المبيعات والأرباح
- ⚙️ **إعدادات المتجر** - تخصيص المتجر

---

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
- تحديث الأسعار الجماعي

### 🛒 إدارة الطلبات
- عرض الطلبات الجديدة
- تحديث حالة الطلب
- طباعة فواتير الطلبات
- تعيين التوصيل
- إلغاء الطلبات
- معالجة الاسترجاع

### 📈 التقارير والتحليلات
- تقارير المبيعات اليومية
- تقارير الأرباح
- تحليل أداء المنتجات
- تقارير العملاء
- تصدير البيانات

### ⚙️ إعدادات المتجر
- تعديل بيانات المتجر
- إدارة ساعات العمل
- إعدادات التوصيل
- طرق الدفع
- الإشعارات

---

## 🔧 البنية التقنية

### التقنيات المستخدمة

| التقنية | الاستخدام |
|---------|----------|
| **Flutter 3.10+** | Framework الأساسي |
| **Dart 3.0+** | لغة البرمجة |
| **Riverpod 3.x** | State Management |
| **GraphQL** | API Communication |
| **graphql_flutter** | GraphQL Client |
| **Go Router** | Navigation |
| **Firebase** | Analytics & Messaging |
| **Hooks** | Widget Lifecycle |

### الـ Backend

- **Cloudflare Workers** - API Gateway
- **GraphQL Yoga** - GraphQL Server
- **Drizzle ORM** - Database ORM
- **PostgreSQL** - Database
- **JWT** - Authentication

---

## 📁 هيكل المشروع

```
lib/
├── main.dart                    # Entry Point
│
├── core/                        # Core Utilities
│   ├── graphql/
│   │   ├── graphql_config.dart  # GraphQL Client Setup
│   │   ├── queries.dart         # GraphQL Queries
│   │   └── mutations.dart       # GraphQL Mutations
│   ├── theme/
│   │   └── alibaba_theme.dart   # App Theme (Alibaba Style)
│   ├── constants/
│   └── utils/
│
├── data/                        # Data Layer
│   └── repositories/
│       ├── repositories.dart    # Barrel file
│       ├── auth_repository.dart
│       ├── merchant_repository.dart
│       ├── product_repository.dart
│       └── order_repository.dart
│
├── providers/                   # State Management (Riverpod 3.x)
│   ├── repository_providers.dart
│   ├── auth_providers.dart
│   ├── dashboard_providers.dart
│   ├── product_providers.dart
│   └── order_providers.dart
│
├── features/                    # Feature Modules
│   ├── auth/
│   ├── dashboard/
│   ├── products/
│   ├── orders/
│   ├── customers/
│   ├── reports/
│   └── settings/
│
├── shared/                      # Shared Components
│   ├── widgets/
│   └── utils/
│
└── apps/                        # App Configuration
```

---

## 🚀 التثبيت

### المتطلبات

- Flutter SDK 3.10.0 أو أحدث
- Dart SDK 3.0.0 أو أحدث
- Android Studio / VS Code
- Git

### خطوات التثبيت

```bash
# 1. Clone المشروع
git clone https://github.com/your-repo/mbuy_merchant.git
cd mbuy_merchant

# 2. تثبيت التبعيات
flutter pub get

# 3. إعداد المتغيرات البيئية
cp .env.example .env
# قم بتعديل .env بالقيم الصحيحة

# 4. تشغيل code generation (إذا لزم الأمر)
dart run build_runner build --delete-conflicting-outputs
```

---

## ▶️ التشغيل

### Development

```bash
# تشغيل على المحاكي
flutter run

# تشغيل مع hot reload
flutter run --hot

# تشغيل على جهاز محدد
flutter run -d <device_id>

# عرض الأجهزة المتاحة
flutter devices
```

### Build

```bash
# Android APK
flutter build apk --release

# Android App Bundle
flutter build appbundle --release

# iOS
flutter build ios --release

# Web
flutter build web --release
```

---

## 📦 State Management

نستخدم **Riverpod 3.x** لإدارة الحالة:

### Repository Providers

```dart
/// Auth Repository Provider
final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository();
});

/// Current Merchant Provider
final currentMerchantProvider =
    NotifierProvider<CurrentMerchantNotifier, Merchant?>(
        CurrentMerchantNotifier.new);
```

### Feature Providers

```dart
/// Dashboard Stats Provider
final dashboardStatsProvider =
    FutureProvider.family<DashboardStats, DashboardParams>((ref, params) async {
      final repo = ref.watch(merchantRepositoryProvider);
      return repo.getDashboardStats(...);
    });

/// Orders Provider
final ordersProvider = FutureProvider.family<OrdersResult, OrdersParams>((
  ref, params,
) async {
  final repo = ref.watch(orderRepositoryProvider);
  return repo.getOrders(...);
});
```

---

## 🔌 GraphQL API

### Configuration

```dart
class GraphQLConfig {
  static const String _endpoint = 'https://your-worker.workers.dev/graphql';
  
  static GraphQLClient getClient() {
    final httpLink = HttpLink(_endpoint);
    final authLink = AuthLink(getToken: () async => await getAuthToken());
    
    return GraphQLClient(
      cache: GraphQLCache(),
      link: authLink.concat(httpLink),
    );
  }
}
```

### Queries Example

```dart
class MerchantQueries {
  static const String getDashboard = r'''
    query GetDashboard($merchantId: ID!, $startDate: DateTime, $endDate: DateTime) {
      merchantDashboard(merchantId: $merchantId, startDate: $startDate, endDate: $endDate) {
        totalOrders
        totalRevenue
        pendingOrders
        completedOrders
        topProducts {
          id
          name
          soldCount
        }
      }
    }
  ''';
}
```

### Mutations Example

```dart
class ProductMutations {
  static const String createProduct = r'''
    mutation CreateProduct($input: CreateProductInput!) {
      createProduct(input: $input) {
        id
        name
        sku
        price
        status
      }
    }
  ''';
}
```

---

## 🎨 Theme (Alibaba Style)

التطبيق يستخدم ثيم مستوحى من Alibaba:

```dart
class AlibabaTheme {
  // Primary Colors
  static const Color primary = Color(0xFFFF6A00);      // Orange
  static const Color secondary = Color(0xFFFFE4CC);    // Light Orange
  
  // Status Colors
  static const Color success = Color(0xFF52C41A);
  static const Color warning = Color(0xFFFAAD14);
  static const Color error = Color(0xFFFF4D4F);
  
  // Neutral Colors
  static const Color background = Color(0xFFF5F5F5);
  static const Color surface = Colors.white;
}
```

---

## 📱 Screenshots

| لوحة التحكم | المنتجات | الطلبات |
|------------|----------|---------|
| ![Dashboard](screenshots/dashboard.png) | ![Products](screenshots/products.png) | ![Orders](screenshots/orders.png) |

---

## 🧪 الاختبارات

```bash
# تشغيل جميع الاختبارات
flutter test

# تشغيل اختبارات محددة
flutter test test/unit/

# تشغيل مع coverage
flutter test --coverage
```

---

## 📄 الترخيص

هذا المشروع خاص بـ MBUY Platform.

---

## 👥 فريق التطوير

- **Backend**: Cloudflare Workers + GraphQL
- **Mobile**: Flutter + Riverpod
- **Database**: PostgreSQL + Drizzle ORM

---

<div align="center">

**صُنع بـ ❤️ لمنصة MBUY**

</div>
