# نظام Auth المخصص لـ MBUY - دليل التنفيذ

## نظرة عامة

تم بناء نظام Auth مخصص بالكامل داخل Cloudflare Worker لمشروع mbuy، بدون الاعتماد على Supabase Auth في التطبيق. Flutter يتعامل فقط مع الـ Worker كـ API، والـ Worker هو المسؤول عن جميع عمليات المصادقة.

---

## البنية المعمارية

```
Flutter App → Cloudflare Worker (Auth) → Supabase (Database Only)
```

- **Flutter**: يرسل طلبات Auth إلى Worker فقط
- **Worker**: يدير التسجيل، تسجيل الدخول، إصدار JWT، والتحقق منه
- **Supabase**: قاعدة بيانات فقط (Postgres + RLS) - لا Supabase Auth

---

## الملفات المُنشأة/المُعدّلة

### 1. Database Migrations

**الملف:** `mbuy-backend/migrations/20250107000001_create_mbuy_auth_tables.sql`

- جدول `mbuy_users`: المستخدمون مع password_hash
- جدول `mbuy_sessions`: الجلسات النشطة
- ربط مع `user_profiles` و `stores` عبر `mbuy_user_id` و `mbuy_owner_id`

### 2. Worker - Types

**الملف:** `mbuy-worker/src/types.ts`

تمت إضافة:
- `SUPABASE_SERVICE_ROLE_KEY`: للوصول إلى قاعدة البيانات
- `JWT_SECRET`: لتوقيع JWT مخصص
- `PASSWORD_HASH_ROUNDS`: عدد جولات التشفير (اختياري)

### 3. Worker - Auth Utilities

**الملف:** `mbuy-worker/src/utils/auth.ts`

- `signJWT()`: توقيع JWT مخصص
- `verifyJWT()`: التحقق من JWT
- `hashPassword()`: تشفير كلمة المرور (PBKDF2)
- `verifyPassword()`: التحقق من كلمة المرور
- `hashToken()`: hash للتوكن لتتبع الجلسات

### 4. Worker - Supabase Client

**الملف:** `mbuy-worker/src/utils/supabase.ts`

- `createSupabaseClient()`: إنشاء Supabase client باستخدام Service Role Key
- دوال مساعدة للاستعلامات (query, insert, update, delete)

### 5. Worker - Auth Middleware

**الملف:** `mbuy-worker/src/middleware/authMiddleware.ts`

- `mbuyAuthMiddleware`: middleware للتحقق من JWT في المسارات المحمية
- يضيف `userId`, `userEmail`, `userType` إلى context

### 6. Worker - Auth Endpoints

**الملف:** `mbuy-worker/src/endpoints/auth.ts`

- `POST /auth/register`: تسجيل مستخدم جديد
- `POST /auth/login`: تسجيل الدخول
- `GET /auth/me`: جلب بيانات المستخدم الحالي (محمي)
- `POST /auth/logout`: تسجيل الخروج

### 7. Worker - Main Index

**الملف:** `mbuy-worker/src/index.ts`

- تم استبدال JWT middleware القديم بـ `mbuyAuthMiddleware`
- تمت إضافة Auth routes الجديدة

### 8. Flutter - Secure Storage

**الملف:** `saleh/lib/core/services/secure_storage_service.dart`

- حفظ JWT token بشكل آمن
- حفظ user ID و email
- دوال للتحقق من حالة تسجيل الدخول

### 9. Flutter - MBUY Auth Service

**الملف:** `saleh/lib/features/auth/data/mbuy_auth_service.dart`

- `register()`: تسجيل مستخدم جديد
- `login()`: تسجيل الدخول
- `getCurrentUser()`: جلب بيانات المستخدم
- `logout()`: تسجيل الخروج

### 10. Flutter - API Service

**الملف:** `saleh/lib/core/services/api_service.dart`

- تم تحديث `_getJwtToken()` لاستخدام Secure Storage أولاً
- Fallback إلى Supabase Auth للتوافق مع الكود القديم

---

## خطوات النشر

### 1. تشغيل Migration

```bash
cd mbuy-backend
supabase db push
# أو
supabase migration up
```

### 2. إعداد Secrets في Cloudflare Worker

```bash
cd mbuy-worker
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put JWT_SECRET
npx wrangler secret put PASSWORD_HASH_ROUNDS  # اختياري (افتراضي: 100000)
```

### 3. نشر Worker

```bash
cd mbuy-worker
npx wrangler deploy
```

### 4. تحديث Flutter Dependencies

تأكد من وجود `flutter_secure_storage` في `pubspec.yaml`:

```yaml
dependencies:
  flutter_secure_storage: ^9.0.0
```

ثم:

```bash
cd saleh
flutter pub get
```

---

## استخدام النظام الجديد في Flutter

### تسجيل مستخدم جديد

```dart
import 'package:saleh/lib/features/auth/data/mbuy_auth_service.dart';

try {
  final result = await MbuyAuthService.register(
    email: 'user@example.com',
    password: 'password123',
    fullName: 'John Doe',
    phone: '+1234567890',
  );
  
  print('User registered: ${result['user']}');
  print('Token: ${result['token']}');
} catch (e) {
  print('Registration failed: $e');
}
```

### تسجيل الدخول

```dart
try {
  final result = await MbuyAuthService.login(
    email: 'user@example.com',
    password: 'password123',
  );
  
  print('User logged in: ${result['user']}');
} catch (e) {
  print('Login failed: $e');
}
```

### جلب بيانات المستخدم الحالي

```dart
try {
  final user = await MbuyAuthService.getCurrentUser();
  print('Current user: $user');
} catch (e) {
  print('Failed to get user: $e');
}
```

### تسجيل الخروج

```dart
await MbuyAuthService.logout();
```

### التحقق من حالة تسجيل الدخول

```dart
final isLoggedIn = await MbuyAuthService.isLoggedIn();
```

---

## الأمان

### 1. كلمات المرور

- يتم تشفير كلمات المرور باستخدام PBKDF2 مع SHA-256
- لا يتم تخزين كلمات المرور بنص صريح أبداً
- Salt عشوائي لكل مستخدم

### 2. JWT Tokens

- يتم توقيع JWT باستخدام `JWT_SECRET` قوي
- مدة صلاحية الـ token: 30 يوم
- يتم التحقق من التوقيع في كل طلب محمي

### 3. Secrets

- جميع المفاتيح الحساسة في Cloudflare Worker Secrets
- لا توجد مفاتيح في كود Flutter
- `SUPABASE_SERVICE_ROLE_KEY` موجود فقط في Worker

### 4. RLS Policies

- RLS Policies مفتوحة للـ Service Role فقط
- لا يمكن للعملاء الوصول مباشرة إلى قاعدة البيانات

---

## ربط مع الجداول الموجودة

### user_profiles

تمت إضافة عمود `mbuy_user_id` للربط:

```sql
ALTER TABLE user_profiles 
  ADD COLUMN mbuy_user_id UUID REFERENCES mbuy_users(id);
```

### stores

تمت إضافة عمود `mbuy_owner_id` للربط:

```sql
ALTER TABLE stores 
  ADD COLUMN mbuy_owner_id UUID REFERENCES mbuy_users(id);
```

---

## Migration Strategy

للمستخدمين الموجودين مسبقاً:

1. يمكن إنشاء `mbuy_users` يدوياً من `auth.users`
2. ربط `mbuy_user_id` في `user_profiles` مع `mbuy_users.id`
3. ربط `mbuy_owner_id` في `stores` مع `mbuy_users.id`

---

## الاختبار

### اختبار Worker Endpoints

```bash
# Register
curl -X POST https://misty-mode-b68b.baharista1.workers.dev/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","full_name":"Test User"}'

# Login
curl -X POST https://misty-mode-b68b.baharista1.workers.dev/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Get Current User (requires token)
curl -X GET https://misty-mode-b68b.baharista1.workers.dev/auth/me \
  -H "Authorization: Bearer <token>"
```

---

## ملاحظات مهمة

1. **Backward Compatibility**: تم الحفاظ على التوافق مع الكود القديم (Supabase Auth) كـ fallback
2. **Migration**: يجب تشغيل migration قبل استخدام النظام الجديد
3. **Secrets**: يجب إعداد جميع Secrets في Cloudflare Worker قبل النشر
4. **Testing**: اختبر جميع المسارات قبل الانتقال إلى Production

---

## الخطوات التالية (اختياري)

1. إضافة Refresh Tokens
2. إضافة Password Reset
3. إضافة Email Verification
4. إضافة Two-Factor Authentication
5. إضافة Rate Limiting للـ Auth endpoints
6. إضافة Audit Logging

---

## الدعم

في حالة وجود مشاكل:

1. تحقق من Worker Logs في Cloudflare Dashboard
2. تحقق من Supabase Logs
3. تحقق من Flutter Debug Console
4. تأكد من إعداد جميع Secrets بشكل صحيح

---

**تاريخ الإنشاء:** 2025-01-07  
**آخر تحديث:** 2025-01-07

