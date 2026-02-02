# 🔐 بيانات الدخول المحدثة

## ✅ تم التحديث بنجاح

### حساب التاجر (Merchant):
```
الاسم: معاذ
البريد: merchant@mbuy.dev
كلمة المرور: 123456
النوع: merchant
```

### حساب العميل (Customer):
```
الاسم: Test Customer
البريد: customer@mbuy.dev
كلمة المرور: 123456
النوع: customer
```

---

## 🗄️ قاعدة البيانات (Adminer)

**الرابط:** http://localhost:8080

**بيانات الدخول:**
```
System: PostgreSQL
Server: mbuy-postgres
Username: postgres
Password: postgres123
Database: mbuy_dev
```

**رابط مباشر:** http://localhost:8080/?pgsql=mbuy-postgres&username=postgres&db=mbuy_dev
(اكتب Password: `postgres123`)

---

## 🚀 للدخول الآن:

```powershell
cd C:\mg\mbuy
flutter run
```

**في التطبيق:**
- البريد: `merchant@mbuy.dev`
- كلمة المرور: `123456`

---

## 📊 قاعدة البيانات

تم تحديث:
- ✅ الاسم الكامل → **معاذ**
- ✅ كلمة المرور → **123456** (مشفّرة bcrypt)

---

## ⚠️ ملاحظة مهمة

Worker يحتاج يكون شغال عشان تقدر تسجل دخول:

```powershell
# في Terminal منفصل
cd C:\mg\mbuy-worker
npx wrangler dev --port 8787 --local
```

**أو استخدم Production API مؤقتاً** في [app_config.dart](c:/mg/mbuy/lib/core/app_config.dart#L9):
```dart
static const String apiBaseUrl = 'https://misty-mode-b68b.baharista1.workers.dev';
```

---

**جاهز للتجربة! 🎉**
