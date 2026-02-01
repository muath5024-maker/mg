# 🎯 MBUY Development Environment - دليل سريع

## 🚀 البدء في 3 خطوات

### 1️⃣ تشغيل Docker

```bash
cd C:\mg\docker
start-dev.bat
```

### 2️⃣ تعديل Flutter API Config

في `C:\mg\mbuy\lib\core\config\api_config.dart`:

```dart
static const String baseUrl = 'http://localhost:8787';
```

### 3️⃣ تشغيل التطبيق

```bash
cd C:\mg\mbuy
flutter run
```

---

## 📊 الخدمات المتاحة

| الخدمة | الرابط |
|--------|--------|
| Worker API | http://localhost:8787 |
| Adminer (DB UI) | http://localhost:8080 |
| MinIO Console | http://localhost:9001 |
| AnythingLLM | http://localhost:3001 |
| n8n | http://localhost:5678 |

---

## 📚 الملفات المهمة

- **DEV_GUIDE.md** - دليل تفصيلي للتطوير
- **ARCHITECTURE.md** - شرح البنية والتحول من الإنتاج للتطوير
- **QUICK_START.md** - أوامر سريعة
- **docker-compose.dev.yml** - تعريف الخدمات
- **.env.dev** - المتغيرات البيئية

---

## 🛑 إيقاف البيئة

```bash
cd C:\mg\docker
stop-dev.bat
```

---

## 🔍 حل المشاكل

### Worker لا يعمل؟
```bash
docker-compose -f docker-compose.dev.yml logs worker
```

### قاعدة البيانات فارغة؟
```bash
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d
```

### Flutter لا يتصل؟
تأكد من:
1. Worker يعمل: `curl http://localhost:8787/health`
2. API URL صحيح في `api_config.dart`
3. للجهاز الحقيقي، استخدم IP الجهاز بدلاً من localhost

---

## 💡 نصائح

✅ استخدم Adminer لإدارة قاعدة البيانات بصرياً
✅ راقب logs باستمرار أثناء التطوير
✅ البيانات التجريبية موجودة في `db/init/01-init.sql`

---

**للمزيد: اقرأ DEV_GUIDE.md**
