# 🚀 دليل البدء السريع - MBUY Development
# Quick Start Guide - التطوير المحلي

<div dir="rtl">

## ✅ ما تم إنجازه

### 1. البيئة المحلية جاهزة:
- ✅ PostgreSQL Database على `localhost:5432`
- ✅ Redis Cache على `localhost:6379`
- ✅ MinIO Storage على `localhost:9000`
- ✅ Adminer (Database UI) على `http://localhost:8080`

### 2. تطبيق Flutter معدّل:
- ✅ تم تغيير `apiBaseUrl` إلى `http://localhost:8787`
- ✅ البيانات التجريبية موجودة (2 users, 1 store, 1 product)

---

## 🎯 خطوات التطوير الآن

### الطريقة 1: تطوير بدون Worker (مؤقتاً)

إذا كنت تريد البدء فوراً بتطوير الواجهة:

```powershell
# 1. تشغيل خدمات Docker فقط (Database + Cache)
cd C:\mg\docker
docker-compose -f docker-compose.dev.yml up -d postgres redis adminer minio

# 2. تشغيل تطبيق Flutter
cd C:\mg\mbuy
flutter run -d windows

# أو للهاتف:
flutter run
```

**ملاحظة:** التطبيق سيحاول الاتصال بـ Worker على `localhost:8787` ولن يجد أحد.
لكن يمكنك تطوير الواجهات (UI) بدون API مؤقتاً.

---

### الطريقة 2: تطوير كامل مع Worker

Worker يحتاج بيئة Cloudflare خاصة. يمكنك:

#### الخيار أ: استخدام Docker للـ Worker

```powershell
# بناء وتشغيل Worker في Docker
cd C:\mg\docker
docker-compose -f docker-compose.dev.yml up -d worker

# فحص الحالة
docker logs mbuy-worker -f
```

#### الخيار ب: تشغيل Worker محلياً بـ Wrangler

```powershell
cd C:\mg\mbuy-worker

# تثبيت Dependencies (مرة واحدة)
npm install

# تشغيل مع Wrangler
npm run dev

# أو تحديد Port مباشرة
npx wrangler dev --port 8787 --local
```

---

## 🎨 أدوات التطوير المتاحة

### 1. VS Code (حالياً)
- **Flutter Extension**: لتطوير التطبيق
- **Terminal المدمج**: لتشغيل الأوامر
- **Git Integration**: للتحكم بالنسخ

### 2. واجهات الويب

| الأداة | URL | الاستخدام |
|--------|-----|-----------|
| **Adminer** | http://localhost:8080 | إدارة قاعدة البيانات بالماوس |
| **MinIO Console** | http://localhost:9001 | إدارة الملفات والصور |

**كيف تدخل Adminer:**
- System: `PostgreSQL`
- Server: `mbuy-postgres`
- Username: `postgres`
- Password: `postgres`
- Database: `mbuy_dev`

### 3. Terminal Commands

```powershell
# إدارة Docker
docker-compose -f docker-compose.dev.yml ps           # حالة الخدمات
docker-compose -f docker-compose.dev.yml logs worker  # سجلات Worker
docker-compose -f docker-compose.dev.yml restart      # إعادة تشغيل

# قاعدة البيانات
docker exec -it mbuy-postgres psql -U postgres -d mbuy_dev
# ثم استخدم SQL مباشرة:
# SELECT * FROM users;
# SELECT * FROM stores;

# Flutter
flutter doctor             # فحص البيئة
flutter devices            # قائمة الأجهزة المتاحة
flutter run                # تشغيل التطبيق
flutter run -d chrome      # تشغيل في المتصفح
flutter pub get            # تثبيت packages
flutter clean              # تنظيف البناء

# Git
git status                 # حالة التغييرات
git add .                  # إضافة كل التغييرات
git commit -m "msg"        # حفظ commit
git push                   # رفع للسحابة
```

---

## 🔄 التطوير المحلي vs الإنتاج

### البيئة المحلية (الآن):
```
Flutter App → http://localhost:8787 (Worker) → PostgreSQL (localhost:5432)
```
- ✅ كل شيء محلي على جهازك
- ✅ بدون إنترنت
- ✅ مجاني تماماً
- ✅ تطوير سريع بدون تأخير

### الإنتاج (بعد النشر):
```
Flutter App → https://your-worker.workers.dev → Supabase PostgreSQL
```
- ☁️ في السحابة (Cloudflare + Supabase)
- 🌍 سريع عالمياً
- 💰 تكلفة حسب الاستخدام

### التبديل بين البيئات:

**للتطوير المحلي:**
```dart
// في mbuy/lib/core/app_config.dart
static const String apiBaseUrl = 'http://localhost:8787'; // حالياً
```

**للإنتاج:**
```dart
static const String apiBaseUrl = 'https://misty-mode-b68b.baharista1.workers.dev';
```

---

## 📊 البيانات التجريبية الموجودة

```sql
-- Users
merchant@mbuy.dev  | password: test123456 | نوع: merchant
customer@mbuy.dev  | password: test123456 | نوع: customer

-- Stores
Test Store (slug: test-store)

-- Products
منتج تجريبي | السعر: 99.99 ريال
```

---

## 🐛 استكشاف الأخطاء

### المشكلة: Flutter لا يتصل بالـ API
```powershell
# تحقق من Worker يعمل
curl http://localhost:8787/
# يجب أن يرجع: {"ok":true,"message":"MBUY API Gateway","version":"2.0.0"}

# إذا لم يعمل، شغله:
cd C:\mg\mbuy-worker
npx wrangler dev --port 8787
```

### المشكلة: Database error
```powershell
# تحقق من PostgreSQL يعمل
docker exec mbuy-postgres psql -U postgres -d mbuy_dev -c "SELECT COUNT(*) FROM users;"

# إذا لم يعمل، أعد تشغيل
docker-compose -f docker-compose.dev.yml restart postgres
```

### المشكلة: Flutter build fails
```powershell
# تنظيف وإعادة بناء
cd C:\mg\mbuy
flutter clean
flutter pub get
flutter run
```

---

## 🎯 سير العمل المقترح

### للتطوير اليومي:

```powershell
# 1. الصباح - تشغيل البيئة
cd C:\mg\docker
.\start-dev.bat

# 2. تشغيل Worker (في نافذة منفصلة)
cd C:\mg\mbuy-worker
npx wrangler dev --port 8787

# 3. تشغيل Flutter (في نافذة ثالثة)
cd C:\mg\mbuy
flutter run

# 4. التطوير في VS Code
code C:\mg\mbuy
# عدّل الملفات، احفظ، Hot Reload تلقائي

# 5. نهاية اليوم - إيقاف
cd C:\mg\docker
.\stop-dev.bat
```

---

## 📝 ملاحظات مهمة

1. **Hot Reload**: Flutter يدعم Hot Reload (حفظ الملف = تحديث فوري)
2. **Database**: تغييرات قاعدة البيانات تُحفظ في `docker/volumes/`
3. **Git**: لا تنسى `git commit` كل ساعة تقريباً
4. **Logs**: استخدم `docker logs -f mbuy-worker` لمتابعة الأخطاء

---

## 🚀 يلا نبدأ!

```powershell
# أسهل طريقة للبدء الآن:
cd C:\mg\mbuy
flutter run

# شاهد التطبيق يعمل، ثم ابدأ التعديل
```

**Happy Coding! 💻🎉**

</div>
