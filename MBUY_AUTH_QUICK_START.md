# دليل البدء السريع - نظام Auth المخصص

## الخطوات السريعة

### 1. تشغيل Migration

```bash
cd mbuy-backend
supabase db push
```

### 2. إعداد Secrets في Cloudflare

```bash
cd mbuy-worker
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
# أدخل Service Role Key من Supabase Dashboard

npx wrangler secret put JWT_SECRET
# أدخل مفتاح قوي (مثلاً: openssl rand -hex 32)

npx wrangler secret put PASSWORD_HASH_ROUNDS
# أدخل: 100000
```

### 3. نشر Worker

```bash
npx wrangler deploy
```

### 4. تحديث Flutter

```bash
cd saleh
flutter pub add flutter_secure_storage
flutter pub get
```

---

## استخدام في Flutter

### استبدال AuthService القديم

```dart
// بدلاً من:
import 'package:saleh/lib/features/auth/data/auth_service.dart';
await AuthService.signUp(...);

// استخدم:
import 'package:saleh/lib/features/auth/data/mbuy_auth_service.dart';
await MbuyAuthService.register(...);
```

### مثال كامل

```dart
import 'package:saleh/lib/features/auth/data/mbuy_auth_service.dart';

// تسجيل مستخدم جديد
final result = await MbuyAuthService.register(
  email: 'user@example.com',
  password: 'password123',
  fullName: 'John Doe',
);

// تسجيل الدخول
final loginResult = await MbuyAuthService.login(
  email: 'user@example.com',
  password: 'password123',
);

// جلب بيانات المستخدم
final user = await MbuyAuthService.getCurrentUser();

// تسجيل الخروج
await MbuyAuthService.logout();
```

---

## Endpoints المتاحة

- `POST /auth/register` - تسجيل مستخدم جديد
- `POST /auth/login` - تسجيل الدخول
- `GET /auth/me` - جلب بيانات المستخدم (محمي)
- `POST /auth/logout` - تسجيل الخروج (محمي)

---

## ملاحظات

- جميع المسارات التي تبدأ بـ `/secure/` تحتاج JWT token في header
- Token يتم حفظه تلقائياً في Secure Storage
- ApiService يستخدم Token تلقائياً في جميع الطلبات

---

**للمزيد من التفاصيل:** راجع `MBUY_CUSTOM_AUTH_IMPLEMENTATION.md`

