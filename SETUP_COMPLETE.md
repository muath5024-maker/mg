# ✅ الإعداد الكامل - MBUY Development Environment
# Setup Complete - Ready to Start!

<div dir="rtl">

## 🎉 تم بنجاح!

---

## 📍 أين تطور؟ (غير Terminal)

### 1. **VS Code** - محرر الكود الرئيسي ✅
   - **الموقع**: مفتوح حالياً
   - **المسار**: `C:\mg\mbuy`
   - **المميزات**:
     - Flutter Extension مثبت
     - Git مدمج
     - Terminal مدمج
     - IntelliSense (إكمال تلقائي)
     - Debugging tools
     - Hot Reload visualization

### 2. **Adminer** - واجهة قاعدة البيانات 🌐
   - **الرابط**: http://localhost:8080
   - **الاستخدام**: إدارة قاعدة البيانات بالماوس
   - **تسجيل دخول**:
     - System: `PostgreSQL`
     - Server: `mbuy-postgres`
     - Username: `postgres`
     - Password: `postgres`
     - Database: `mbuy_dev`
   - **المميزات**:
     - عرض الجداول
     - تعديل البيانات
     - تشغيل SQL
     - استيراد/تصدير

### 3. **MinIO Console** - مدير الملفات 📁
   - **الرابط**: http://localhost:9001
   - **تسجيل دخول**:
     - Username: `minioadmin`
     - Password: `minioadmin`
   - **الاستخدام**: رفع/عرض الصور والملفات

### 4. **Flutter DevTools** - أدوات تطوير Flutter 🎨
   ```powershell
   cd C:\mg\mbuy
   flutter run -d chrome
   # سيفتح DevTools تلقائياً في المتصفح
   ```
   - **المميزات**:
     - Widget Inspector
     - Performance Profiler
     - Network Monitor
     - Logs

### 5. **Database Clients** (اختياري)
   - **DBeaver**: https://dbeaver.io/download/
   - **TablePlus**: https://tableplus.com/
   - **pgAdmin**: https://www.pgadmin.org/
   - **الاتصال**:
     - Host: `localhost`
     - Port: `5432`
     - Database: `mbuy_dev`
     - Username: `postgres`
     - Password: `postgres`

---

## ☁️ هل كل شي يستمر محلي بعد النشر؟

### ⚠️ لا، التطوير محلي ≠ الإنتاج

| المرحلة | البيئة | الموقع | التكلفة |
|---------|--------|--------|----------|
| **التطوير** (الآن) | محلية 100% | جهازك | مجاني تماماً |
| **الإنتاج** (بعد النشر) | السحابة ☁️ | Cloudflare + Supabase | حسب الاستخدام |

### التطوير المحلي (حالياً):
```
📱 Flutter App
    ↓ http://localhost:8787
💻 Worker API (Node.js محلي)
    ↓ localhost:5432
🗄️ PostgreSQL (Docker محلي)
```

**المميزات:**
- ✅ كل شي على جهازك
- ✅ بدون إنترنت
- ✅ تطوير سريع
- ✅ تكلفة صفر
- ✅ تجربة أي شي بدون خوف

### الإنتاج (بعد النشر):
```
📱 Flutter App
    ↓ https://api.mbuy.app
☁️ Cloudflare Workers (عالمي)
    ↓ Supabase URL
🗄️ PostgreSQL (Supabase Cloud)
```

**المميزات:**
- 🌍 سريع عالمياً
- 🚀 مقياس تلقائي
- 🔒 أمان عالي
- 💰 تكلفة حسب الاستخدام

### كيف التبديل؟

**خطوة واحدة فقط!** تغيير سطر واحد:

```dart
// ملف: C:\mg\mbuy\lib\core\app_config.dart

// للتطوير المحلي:
static const String apiBaseUrl = 'http://localhost:8787';

// للإنتاج:
static const String apiBaseUrl = 'https://your-worker.workers.dev';
```

**بس! كل شي باقي نفسه.**

---

## 🚀 يلا نبدأ - خطوات البداية

### الطريقة السريعة (الأسهل):

```powershell
# 1. تشغيل قاعدة البيانات
cd C:\mg\docker
docker-compose -f docker-compose.dev.yml up -d postgres redis adminer

# 2. تشغيل التطبيق
cd C:\mg\mbuy
flutter run

# 3. ابدأ التطوير في VS Code!
```

### الطريقة الكاملة (مع Worker):

```powershell
# Terminal 1: Docker Services
cd C:\mg\docker
.\start-dev.bat

# Terminal 2: Worker API
cd C:\mg\mbuy-worker
npx wrangler dev --port 8787

# Terminal 3: Flutter App
cd C:\mg\mbuy
flutter run

# الآن كل شي شغال! 🎉
```

---

## 📚 الملفات المرجعية

تم إنشاء هذه الأدلة لمساعدتك:

1. **[START_HERE.md](START_HERE.md)** - دليل البدء السريع الشامل
2. **[TERMINAL_DEVELOPMENT.md](TERMINAL_DEVELOPMENT.md)** - دليل التطوير من Terminal فقط
3. **[docker/DEV_GUIDE.md](docker/DEV_GUIDE.md)** - دليل Docker المفصّل
4. **[docker/ARCHITECTURE.md](docker/ARCHITECTURE.md)** - شرح البنية
5. **[docker/QUICK_START.md](docker/QUICK_START.md)** - أوامر سريعة

---

## 🗂️ هيكل المشروع

```
C:\mg\
├── mbuy/                    ← تطبيق Flutter (العميل)
│   ├── lib/
│   │   ├── main.dart
│   │   ├── core/
│   │   │   └── app_config.dart  ← هنا تغيّر API URL
│   │   ├── features/            ← الصفحات والمميزات
│   │   └── shared/              ← المكونات المشتركة
│   └── pubspec.yaml
│
├── mbuy-worker/             ← Backend API (Worker)
│   ├── src/
│   │   ├── index.ts         ← Main router
│   │   ├── routes/          ← API endpoints
│   │   └── middleware/      ← Auth, etc.
│   └── package.json
│
├── docker/                  ← بيئة التطوير المحلية
│   ├── docker-compose.dev.yml  ← إعدادات Docker
│   ├── start-dev.bat           ← تشغيل سريع
│   └── stop-dev.bat            ← إيقاف
│
├── START_HERE.md            ← ابدأ من هنا!
└── TERMINAL_DEVELOPMENT.md  ← دليل Terminal
```

---

## 🎯 أمثلة عملية

### مثال 1: تعديل صفحة Home

```powershell
# 1. افتح الملف في VS Code
code C:\mg\mbuy\lib\features\home\home_screen.dart

# 2. عدّل الكود
# مثلاً: غيّر النص، أضف زر، عدّل الألوان

# 3. احفظ (Ctrl+S)
# Flutter سيعمل Hot Reload تلقائياً!

# 4. شاهد التغيير فوراً في التطبيق
```

### مثال 2: إضافة user جديد في Database

```powershell
# الطريقة 1: من Adminer (بالماوس)
# افتح http://localhost:8080
# اذهب لجدول users
# اضغط "New item"
# املأ البيانات واحفظ

# الطريقة 2: من Terminal (SQL)
docker exec mbuy-postgres psql -U postgres -d mbuy_dev -c "
INSERT INTO users (email, password_hash, user_type)
VALUES ('newuser@mbuy.dev', 'hash123', 'customer');
"
```

### مثال 3: اختبار API endpoint

```powershell
# تسجيل دخول
$response = Invoke-RestMethod -Uri http://localhost:8787/auth/login `
  -Method POST `
  -Body (@{email='merchant@mbuy.dev'; password='test123456'} | ConvertTo-Json) `
  -ContentType 'application/json'

# عرض النتيجة
$response

# استخدام Token
$token = $response.token
$headers = @{Authorization = "Bearer $token"}

# طلب محمي
Invoke-RestMethod -Uri http://localhost:8787/secure/merchant/dashboard `
  -Headers $headers
```

---

## ✅ الخلاصة

### ما تم إنجازه:
- ✅ Docker environment جاهز (PostgreSQL, Redis, MinIO, Adminer)
- ✅ Flutter app معدّل للاتصال بالـ API المحلي
- ✅ قاعدة بيانات مع بيانات تجريبية
- ✅ أدلة شاملة باللغة العربية
- ✅ أدوات تطوير متعددة (VS Code, Adminer, Terminal)

### أين تطور:
1. **VS Code** - محرر الكود الرئيسي ✅
2. **Adminer** - http://localhost:8080 ✅
3. **MinIO Console** - http://localhost:9001 ✅
4. **Terminal** - PowerShell ✅
5. **Flutter DevTools** - عند تشغيل `flutter run` ✅

### هل محلي بعد النشر:
- ❌ **لا** - التطوير محلي، الإنتاج في السحابة
- ✅ **نعم** - تقدر تبدل بسطر واحد فقط
- ✅ **مرن** - طوّر محلي، انشر للسحابة متى تبي

---

## 🚀 الخطوة التالية

```powershell
# ابدأ الآن:
cd C:\mg\mbuy
flutter run

# Happy Coding! 💻🎉
```

**كل شي جاهز. يلا نبدأ التطوير!**

</div>
