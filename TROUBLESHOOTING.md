# 🔧 حل مشكلة الدخول للوحة التحكم

## المشكلة: "مو راضي يدخلني لوحة التحكم"

---

## 🎯 السبب المحتمل

### 1. تسجيل الدخول بحساب خاطئ

تطبيق `mbuy` هو تطبيق **عميل** (Customer App)، لكن فيه صفحات merchant.
لوحة التحكم تحتاج حساب `merchant` وليس `customer`.

**البيانات التجريبية:**
```
✅ حساب التاجر (Merchant):
Email: merchant@mbuy.dev
Password: test123456
Type: merchant

❌ حساب العميل (Customer):  
Email: customer@mbuy.dev
Password: test123456
Type: customer
```

---

## ✅ الحل السريع

### الخطوة 1: تسجيل الدخول بحساب التاجر

```powershell
# شغل التطبيق
cd C:\mg\mbuy
flutter run

# في التطبيق:
Email: merchant@mbuy.dev
Password: test123456
```

### الخطوة 2: التحقق من Worker يعمل

```powershell
# في Terminal منفصل
cd C:\mg\mbuy-worker
npx wrangler dev --port 8787 --local

# أو استخدم Supabase URL مباشرة
```

---

## 🔍 فحص المشكلة

### هل Worker يعمل؟

```powershell
# اختبار API
Invoke-RestMethod http://localhost:8787/
# يجب يرجع: {"ok":true,"message":"MBUY API Gateway","version":"2.0.0"}
```

### هل الحسابات موجودة؟

```powershell
# فحص قاعدة البيانات
docker exec mbuy-postgres psql -U postgres -d mbuy_dev -c "SELECT email, user_type FROM users WHERE email LIKE '%mbuy.dev';"
```

---

## 🚀 إذا Worker لا يعمل

### الحل: استخدام Production API

في [mbuy/lib/core/app_config.dart](c:/mg/mbuy/lib/core/app_config.dart#L9):

```dart
// بدل من:
static const String apiBaseUrl = 'http://localhost:8787'; // LOCAL

// استخدم:
static const String apiBaseUrl = 'https://misty-mode-b68b.baharista1.workers.dev'; // PRODUCTION
```

ثم:
```powershell
cd C:\mg\mbuy
flutter run
```

---

## 📊 البيانات الحالية في Database

```sql
-- Users
merchant@mbuy.dev  | merchant | Test Merchant
customer@mbuy.dev  | customer | Test Customer

-- Stores
Test Store (ID: test-store slug)

-- Products
منتج تجريبي | 99.99 ريال
```

---

## 💡 إنشاء حساب merchant جديد

### الطريقة 1: من التطبيق

```
1. افتح التطبيق
2. اضغط "إنشاء حساب"
3. املأ البيانات
4. اختر نوع الحساب: "تاجر" (Merchant)
5. سجل الدخول
```

### الطريقة 2: من Database مباشرة

```powershell
docker exec mbuy-postgres psql -U postgres -d mbuy_dev -c "
INSERT INTO users (email, password_hash, user_type, name, created_at)
VALUES (
  'youremail@example.com',
  '\$2a\$10\$YourHashedPasswordHere',
  'merchant',
  'Your Name',
  NOW()
);
"
```

---

## 🎯 الملخص

**المشكلة الأساسية:** حاجة حساب `merchant` للدخول لوحة التحكم!

**الحل:**
1. سجل دخول بـ `merchant@mbuy.dev` / `test123456`
2. تأكد Worker يعمل (`http://localhost:8787`)
3. أو استخدم Production API مؤقتاً

**إذا ما زالت المشكلة:**
- تحقق من Logs: `flutter run -v`
- تحقق من Network في DevTools
- أرسل الخطأ المحدد

---

## 📞 أوامر مفيدة

```powershell
# فحص سريع كامل
# 1. Database
docker exec mbuy-postgres psql -U postgres -d mbuy_dev -c "SELECT COUNT(*) FROM users;"

# 2. API
Invoke-RestMethod http://localhost:8787/

# 3. Flutter
cd C:\mg\mbuy
flutter doctor

# 4. Logs
docker logs mbuy-worker -f
```
