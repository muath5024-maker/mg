# تقرير تعديل منطق التنقل بناءً على Role

## التاريخ: يناير 2025

## الهدف
تعديل منطق التنقل في تطبيق Flutter ليعتمد على نوع المستخدم (role) من جدول `user_profiles`، بحيث:
- **customer** أو **null** → يعرض واجهة العميل فقط (بدون زر تبديل)
- **merchant** أو **admin** → يعرض Shell مع زر تبديل بين Dashboard و Customer view

---

## الملفات الجديدة

### 1. `saleh/lib/core/role_based_root.dart`
**الوصف**: Root Widget موحّد يعتمد على role المستخدم

**الوظيفة**:
- يستقبل `userProfile`, `role`, `themeProvider`, `appModeProvider`
- إذا كان `role == 'merchant'` أو `'admin'` → يعرض `MerchantAdminShell`
- إذا كان `role == 'customer'` أو `null` → يعرض `CustomerShell` فقط

**الكود الرئيسي**:
```dart
if (role == 'merchant' || role == 'admin') {
  return MerchantAdminShell(...);
}
return CustomerShell(...);
```

---

### 2. `saleh/lib/core/merchant_admin_shell.dart`
**الوصف**: Shell خاص للتاجر/الأدمن يحتوي على:
- لوحة التحكم (Dashboard)
- واجهة التطبيق العادية (Customer view)
- زر تبديل في AppBar

**الميزات**:
- متغير `_showDashboard` للتحكم في العرض الحالي
- AppBar يحتوي على:
  - عنوان ديناميكي: "لوحة التحكم" أو "تطبيق Mbuy"
  - زر تبديل (IconButton) في `actions`
- Body يعرض:
  - `MerchantDashboardScreen` إذا `_showDashboard == true`
  - `CustomerShell` إذا `_showDashboard == false`

**الكود الرئيسي**:
```dart
bool _showDashboard = true;

AppBar(
  title: Text(_showDashboard ? 'لوحة التحكم' : 'تطبيق Mbuy'),
  actions: [
    IconButton(
      icon: Icon(_showDashboard ? Icons.shopping_bag_outlined : Icons.dashboard_outlined),
      onPressed: () {
        setState(() {
          _showDashboard = !_showDashboard;
        });
      },
    ),
  ],
),
body: _showDashboard
    ? MerchantDashboardScreen(...)
    : CustomerShell(...),
```

---

## الملفات المعدلة

### 3. `saleh/lib/core/root_widget.dart`
**التعديلات**:

#### أ) إضافة متغير `_userProfile`:
```dart
Map<String, dynamic>? _userProfile; // User profile from user_profiles table
```

#### ب) تحديث جلب user_profile:
- عند جلب `role` من API، يتم حفظ `profile` كاملاً في `_userProfile`
- تحديث جميع `setState` لتحديث `_userProfile`

#### ج) تحديث منطق العرض:
**قبل**:
```dart
if (_userRole == 'merchant' && _user != null && _appModeProvider.mode == AppMode.merchant) {
  return MerchantHomeScreen(appModeProvider: _appModeProvider);
} else {
  return CustomerShell(...);
}
```

**بعد**:
```dart
return RoleBasedRoot(
  userProfile: _userProfile,
  role: _userRole,
  themeProvider: widget.themeProvider,
  appModeProvider: _appModeProvider,
);
```

#### د) تحديث دعم `admin` role:
- إضافة دعم `role == 'admin'` في جميع الأماكن
- `admin` يتصرف مثل `merchant` (لوحة تحكم + زر تبديل)

#### هـ) إزالة imports غير المستخدمة:
- حذف `import '../features/customer/presentation/screens/customer_shell.dart';`
- حذف `import '../features/merchant/presentation/screens/merchant_home_screen.dart';`

---

## التدفق الجديد

### 1. تسجيل الدخول / استرجاع الجلسة:
```
RootWidget._checkAuthState()
  ↓
AuthRepository.verifyAndLoadUser()
  ↓
ApiService.get('/secure/users/me')
  ↓
حفظ userProfile و role في _userProfile و _userRole
  ↓
RoleBasedRoot(userProfile, role, ...)
```

### 2. عرض الشاشة المناسبة:
```
RoleBasedRoot
  ↓
  ├─ role == 'merchant' أو 'admin'
  │   └─ MerchantAdminShell
  │       ├─ _showDashboard == true → MerchantDashboardScreen
  │       └─ _showDashboard == false → CustomerShell
  │
  └─ role == 'customer' أو null
      └─ CustomerShell (بدون زر تبديل)
```

---

## الحالات المدعومة

### ✅ حالة 1: `role == 'customer'` أو `null`
- **النتيجة**: يعرض `CustomerShell` مباشرة
- **لا يوجد**: زر تبديل في AppBar
- **السلوك**: واجهة العميل العادية فقط

### ✅ حالة 2: `role == 'merchant'`
- **النتيجة**: يعرض `MerchantAdminShell`
- **الافتراضي**: `_showDashboard = true` (لوحة التحكم)
- **زر التبديل**: 
  - إذا `_showDashboard == true` → أيقونة `shopping_bag_outlined` (للانتقال إلى Customer view)
  - إذا `_showDashboard == false` → أيقونة `dashboard_outlined` (للانتقال إلى Dashboard)
- **السلوك**: يمكن التبديل بين Dashboard و Customer view

### ✅ حالة 3: `role == 'admin'`
- **النتيجة**: نفس سلوك `merchant`
- **السلوك**: يمكن التبديل بين Dashboard و Customer view

---

## التوافق مع الكود الحالي

### ✅ تم الحفاظ على:
- `CustomerShell` - يعمل كما هو
- `MerchantDashboardScreen` - يعمل كما هو
- `AppModeProvider` - يعمل كما هو
- Auth flow - يعمل كما هو

### ✅ تم تحديث:
- `RootWidget` - يستخدم `RoleBasedRoot` بدلاً من المنطق المباشر
- دعم `admin` role - تم إضافته في جميع الأماكن

---

## الاختبار

### الحالات المطلوب اختبارها:

#### 1. مستخدم `role = 'customer'`
- ✅ يفتح مباشرة على `CustomerShell`
- ✅ لا يوجد زر تبديل في AppBar
- ✅ يمكنه استخدام جميع ميزات العميل

#### 2. مستخدم `role = 'merchant'`
- ✅ يفتح على `MerchantAdminShell` مع `_showDashboard = true`
- ✅ يعرض `MerchantDashboardScreen` في البداية
- ✅ يوجد زر تبديل في AppBar (أيقونة `shopping_bag_outlined`)
- ✅ عند الضغط على الزر → ينتقل إلى `CustomerShell`
- ✅ عند الضغط مرة أخرى → يعود إلى `MerchantDashboardScreen`

#### 3. مستخدم `role = 'admin'`
- ✅ نفس سلوك `merchant`
- ✅ يمكنه التبديل بين Dashboard و Customer view

---

## الملخص

### الملفات الجديدة (2):
1. `saleh/lib/core/role_based_root.dart`
2. `saleh/lib/core/merchant_admin_shell.dart`

### الملفات المعدلة (1):
1. `saleh/lib/core/root_widget.dart`

### التغييرات الرئيسية:
- ✅ إنشاء `RoleBasedRoot` widget موحّد
- ✅ إنشاء `MerchantAdminShell` مع زر تبديل
- ✅ تحديث `RootWidget` لاستخدام `RoleBasedRoot`
- ✅ إضافة دعم `admin` role
- ✅ حفظ `userProfile` كاملاً في `RootWidget`

---

**تاريخ الإصلاح**: يناير 2025  
**الحالة**: ✅ تم التنفيذ

