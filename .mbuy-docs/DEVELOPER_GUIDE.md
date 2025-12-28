# 📘 دليل المطورين - MBUY Platform

> **⚠️ هذا الملف هو دليل التنفيذ الإجباري**
> أي كود أو تعديل أو هيكلة يجب أن يتوافق معه حرفياً.
> أي تعارض = إيقاف التنفيذ وطلب توضيح.

آخر تحديث: 27 ديسمبر 2025

---

## 📋 جدول المحتويات

1. [المبادئ الأساسية](#1-المبادئ-الأساسية)
2. [هيكل المشاريع](#2-هيكل-المشاريع)
3. [البنية المعمارية](#3-البنية-المعمارية)
4. [نظام التوجيه (Router)](#4-نظام-التوجيه-router)
5. [State Management](#5-state-management)
6. [إنشاء صفحة جديدة](#6-إنشاء-صفحة-جديدة)
7. [نظام الألوان](#7-نظام-الألوان)
8. [قواعد RTL](#8-قواعد-rtl)

---

## 1. المبادئ الأساسية

### ⛔ ممنوعات صارمة

| الممنوع | السبب |
|---------|-------|
| ربط Flutter مباشرة بـ Supabase | يخالف مبدأ الوسيط الواحد |
| منطق تجاري في الواجهة | الواجهة = عرض فقط |
| قرار غير موثق | الوثائق تسبق الكود |
| ازدواجية المسارات | مسار واحد لكل عملية |
| الاجتهاد أو الافتراض | السؤال قبل التنفيذ |

### ✅ مبادئ إلزامية

1. **الوسيط الواحد**: كل تواصل مع البيانات عبر Worker فقط
2. **الواجهة سلبية**: تعرض وترسل، لا تفكر ولا تقرر
3. **التوثيق أولاً**: لا كود بدون توثيق
4. **التنظيف الإجباري**: حذف أي كود غير مستخدم بعد التعديل

---

## 2. هيكل المشاريع

```
C:\muath\
├── .mbuy-docs/         → 📚 التوثيق (المرجع الوحيد)
│   ├── STRICT_RULES.md
│   ├── DEVELOPER_GUIDE.md        ← أنت هنا
│   ├── DESIGN_TOKENS.md
│   └── Architecture_decisions.md
│
├── saleh/              → 📱 Flutter App
├── mbuy-worker/        → ⚙️ Cloudflare Worker (الوسيط)
└── mbuy-backend/       → 🗄️ Supabase
```

---

## 3. البنية المعمارية

### تدفق البيانات (إجباري)

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Flutter   │ ───▶ │   Worker    │ ───▶ │  Supabase   │
│   (عرض)     │ API  │  (وسيط)     │  DB  │ (بيانات)   │
└─────────────┘      └─────────────┘      └─────────────┘
```

### هيكل كل Feature (Clean Architecture)

```
lib/features/my_feature/
├── domain/
│   └── models/
│       └── my_model.dart          ← النموذج
├── data/
│   ├── my_repository.dart         ← التعامل مع Worker
│   └── my_controller.dart         ← إدارة الحالة
└── presentation/
    └── screens/
        └── my_screen.dart         ← الشاشة (عرض فقط)
```

---

## 4. نظام التوجيه (Router)

### أنواع الصفحات

| النوع | الوصف | الموقع في Router |
|-------|-------|------------------|
| **داخل Shell** | صفحات لوحة التحكم (مع Header + BottomNav) | داخل `ShellRoute` |
| **Full Screen** | صفحات كاملة فوق الرئيسية (بدون Shell) | خارج `ShellRoute` |

### هيكل Router

```dart
final router = GoRouter(
  routes: [
    // ═══════════════════════════════════════════════════
    // 1️⃣ داخل Shell (مع Header + BottomNav)
    // ═══════════════════════════════════════════════════
    ShellRoute(
      builder: (context, state, child) => DashboardShell(child: child),
      routes: [
        GoRoute(
          path: '/',
          builder: (context, state) => const HomePage(),
        ),
        GoRoute(
          path: '/products',
          builder: (context, state) => const ProductsPage(),
        ),
        GoRoute(
          path: '/orders',
          builder: (context, state) => const OrdersPage(),
        ),
      ],
    ),

    // ═══════════════════════════════════════════════════
    // 2️⃣ خارج Shell (Full Screen - فوق الرئيسية)
    // ═══════════════════════════════════════════════════
    GoRoute(
      path: '/full/orders-management',
      builder: (context, state) => const FullOrdersManagementPage(),
    ),
    GoRoute(
      path: '/full/product-details/:id',
      builder: (context, state) => ProductDetailsPage(
        id: state.pathParameters['id']!,
      ),
    ),
  ],
);
```

### متى تستخدم ماذا؟

| الحالة | النوع | المسار |
|--------|-------|--------|
| صفحة عادية في Dashboard | داخل Shell | `/products` |
| صفحة إدارة كاملة | Full Screen | `/full/orders-management` |
| تفاصيل عنصر | Full Screen | `/full/product-details/123` |
| Modal/Sheet | `showModalBottomSheet()` | - |

### فتح الصفحات

```dart
// داخل Shell
context.go('/products');

// Full Screen فوق الرئيسية
context.push('/full/orders-management');

// إغلاق Full Screen
context.pop();
```

---

## 5. State Management

### اختيار النمط المناسب

| الحالة | النمط | السبب |
|--------|-------|-------|
| بيانات read-only | `FutureProvider.autoDispose` | ينظف نفسه تلقائياً |
| CRUD operations | `AsyncNotifier` | يوفر methods |
| بيانات ثقيلة | `compute()` | يعمل في Isolate منفصل |

### 1️⃣ FutureProvider.autoDispose (للـ read-only)

```dart
final ordersProvider = FutureProvider.autoDispose<List<Order>>((ref) async {
  final repo = ref.read(orderRepositoryProvider);
  
  // ✅ عبر الوسيط (Worker)
  final json = await repo.fetchOrdersFromWorker();
  
  // ✅ compute() للبيانات الثقيلة
  if (json.length > 10000) {
    return await compute(parseOrders, json);
  }
  
  return parseOrders(json);
});

// دالة parse (يمكن أن تعمل في Isolate)
List<Order> parseOrders(String json) {
  final list = jsonDecode(json) as List;
  return list.map((e) => Order.fromJson(e)).toList();
}
```

### 2️⃣ AsyncNotifier (للـ CRUD)

```dart
class OrdersController extends AsyncNotifier<List<Order>> {
  @override
  Future<List<Order>> build() async {
    return await ref.read(orderRepositoryProvider).getOrders();
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => 
      ref.read(orderRepositoryProvider).getOrders()
    );
  }

  Future<void> deleteOrder(String id) async {
    await ref.read(orderRepositoryProvider).deleteOrder(id);
    await refresh();
  }
}

final ordersControllerProvider = 
    AsyncNotifierProvider<OrdersController, List<Order>>(
      OrdersController.new,
    );
```

### متى تستخدم compute()?

| الحالة | استخدم compute()? |
|--------|-------------------|
| JSON < 1MB | ❌ لا |
| JSON > 1MB | ✅ نعم |
| معالجة صور | ✅ نعم |
| تشفير/فك تشفير | ✅ نعم |
| HTTP requests عادية | ❌ لا (async كافي) |

---

## 6. إنشاء صفحة جديدة

### الخطوة 1️⃣: تحديد النوع

```
هل الصفحة تحتاج Header + BottomNav؟
├── نعم → داخل Shell (/path)
└── لا  → Full Screen (/full/path)
```

### الخطوة 2️⃣: إنشاء الهيكل

```
lib/features/my_feature/
├── domain/models/my_model.dart
├── data/
│   ├── my_repository.dart
│   └── my_controller.dart
└── presentation/screens/my_screen.dart
```

### الخطوة 3️⃣: النموذج

```dart
class MyModel {
  final String id;
  final String title;
  
  MyModel({required this.id, required this.title});
  
  factory MyModel.fromJson(Map<String, dynamic> json) => MyModel(
    id: json['id'],
    title: json['title'],
  );
}
```

### الخطوة 4️⃣: Repository (عبر الوسيط فقط)

```dart
class MyRepository {
  final ApiService _api;
  final AuthTokenStorage _token;

  MyRepository(this._api, this._token);

  Future<List<MyModel>> getItems() async {
    final token = await _token.getAccessToken();
    
    // ✅ عبر Worker فقط
    final response = await _api.get(
      '/secure/my-endpoint',
      headers: {'Authorization': 'Bearer $token'},
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return (data['items'] as List)
          .map((e) => MyModel.fromJson(e))
          .toList();
    }
    throw Exception('Failed to load');
  }
}

final myRepositoryProvider = Provider((ref) {
  return MyRepository(
    ref.watch(apiServiceProvider),
    ref.watch(authTokenStorageProvider),
  );
});
```

### الخطوة 5️⃣: Provider (اختر المناسب)

```dart
// Option A: FutureProvider.autoDispose (read-only)
final myDataProvider = FutureProvider.autoDispose<List<MyModel>>((ref) async {
  return await ref.read(myRepositoryProvider).getItems();
});

// Option B: AsyncNotifier (CRUD)
class MyController extends AsyncNotifier<List<MyModel>> {
  @override
  Future<List<MyModel>> build() async {
    return await ref.read(myRepositoryProvider).getItems();
  }
  
  Future<void> refresh() async { ... }
  Future<void> add(MyModel item) async { ... }
  Future<void> delete(String id) async { ... }
}
```

### الخطوة 6️⃣: الشاشة (عرض فقط)

```dart
class MyFullScreen extends ConsumerWidget {
  const MyFullScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final itemsAsync = ref.watch(myDataProvider);

    return Scaffold(
      appBar: AppBar(
        backgroundColor: AppTheme.primaryColor,
        title: const Text('عنوان الصفحة'),
        // ✅ زر الإغلاق في actions (يسار في RTL)
        actions: [
          IconButton(
            icon: const Icon(Icons.close),
            onPressed: () => context.pop(),
          ),
        ],
      ),
      body: itemsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, st) => Center(child: Text('خطأ: $e')),
        data: (items) => ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: items.length,
          itemBuilder: (context, index) => _buildItem(items[index]),
        ),
      ),
    );
  }

  Widget _buildItem(MyModel item) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: ListTile(
        title: Text(item.title, style: TextStyle(color: AppTheme.darkSlate)),
      ),
    );
  }
}
```

### الخطوة 7️⃣: إضافة Route

```dart
// في app_router.dart

// إذا Full Screen (خارج Shell)
GoRoute(
  path: '/full/my-feature',
  builder: (context, state) => const MyFullScreen(),
),

// إذا داخل Shell
// أضفها داخل routes الخاصة بـ ShellRoute
GoRoute(
  path: '/my-feature',
  builder: (context, state) => const MyScreen(),
),
```

### الخطوة 8️⃣: فتح الصفحة

```dart
// Full Screen
context.push('/full/my-feature');

// داخل Shell
context.go('/my-feature');
```

---

## 7. نظام الألوان

### المصدر الوحيد
```
lib/core/theme/app_theme.dart
```

### 🔒 الألوان مقفلة

| اللون | الكود | الاستخدام |
|-------|-------|-----------|
| **Primary** | `#00B4B4` | الهيدر، الأزرار |
| **Accent** | `#FF6B35` | CTA |
| **Background** | `#F1F5F9` | خلفية |
| **Dark Slate** | `#0F172A` | العناوين |

```dart
color: AppTheme.primaryColor
color: AppTheme.accentColor
color: AppTheme.backgroundColor
```

---

## 8. قواعد RTL

### AppBar في التطبيق العربي

```dart
AppBar(
  title: const Text('العنوان'),
  
  // ✅ زر الإغلاق في actions (يظهر يسار في RTL)
  actions: [
    IconButton(
      icon: const Icon(Icons.close),
      onPressed: () => context.pop(),
    ),
  ],
  
  // ⚠️ leading يظهر يمين في RTL (للـ back button)
  // leading: ... 
)
```

| العنصر | الموقع في RTL |
|--------|---------------|
| `actions` | يسار ← |
| `leading` | يمين → |
| `title` | وسط أو يمين |

---

## ⚠️ تذكير أخير

```
أي شيء غير مذكور في mbuy-docs = ممنوع افتراضياً
في حال الشك = اسأل قبل التنفيذ
```

---

## 📎 ملفات مرتبطة

| الملف | الغرض |
|-------|-------|
| [STRICT_RULES.md](./STRICT_RULES.md) | القواعد الصارمة |
| [DESIGN_TOKENS.md](./DESIGN_TOKENS.md) | ثوابت التصميم |
| [Architecture_decisions.md](./Architecture_decisions.md) | القرارات المعمارية |
