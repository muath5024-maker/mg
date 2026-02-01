# 🐳 MBUY Development Environment

## 📋 نظرة عامة

بيئة تطوير محلية كاملة لمشروع MBUY باستخدام Docker.

---

## 🔄 **الفرق بين الإنتاج والتطوير**

### **الإنتاج (Production):**
| الخدمة | المزود |
|--------|---------|
| Backend API | Cloudflare Workers |
| قاعدة البيانات | Supabase PostgreSQL |
| Storage | Cloudflare R2 / AWS S3 |
| Cache | Cloudflare KV |

### **التطوير (Development):**
| الخدمة | المزود |
|--------|---------|
| Backend API | Worker محلي في Docker |
| قاعدة البيانات | PostgreSQL محلي في Docker |
| Storage | MinIO محلي في Docker |
| Cache | Redis محلي في Docker |

---

## 🚀 **البدء السريع**

### 1️⃣ **تشغيل البيئة التطويرية:**

```bash
# الانتقال لمجلد docker
cd docker

# تشغيل جميع الخدمات
docker-compose -f docker-compose.dev.yml up -d

# متابعة السجلات
docker-compose -f docker-compose.dev.yml logs -f
```

### 2️⃣ **التحقق من الخدمات:**

```bash
# التحقق من حالة الحاويات
docker-compose -f docker-compose.dev.yml ps

# يجب أن ترى جميع الخدمات running ✅
```

### 3️⃣ **الوصول للخدمات:**

| الخدمة | الرابط | المعلومات |
|--------|--------|-----------|
| **Worker API** | http://localhost:8787 | Backend API محلي |
| **PostgreSQL** | localhost:5432 | User: postgres, Pass: postgres123 |
| **Adminer** | http://localhost:8080 | إدارة قاعدة البيانات |
| **Redis** | localhost:6379 | Cache & Sessions |
| **MinIO** | http://localhost:9000 | Object Storage |
| **MinIO Console** | http://localhost:9001 | User: minioadmin |
| **Ollama** | http://localhost:11434 | AI Models |
| **AnythingLLM** | http://localhost:3001 | تحليل البيانات |
| **n8n** | http://localhost:5678 | الأتمتة |

---

## 📝 **إعداد تطبيق Flutter للتطوير المحلي**

### تعديل `lib/core/config/api_config.dart`:

```dart
class ApiConfig {
  // للتطوير المحلي
  static const String baseUrl = 'http://localhost:8787';
  
  // أو استخدم IP الجهاز للاختبار على الموبايل
  // static const String baseUrl = 'http://192.168.1.X:8787';
  
  // للإنتاج
  // static const String baseUrl = 'https://misty-mode-b68b.baharista1.workers.dev';
}
```

### أو استخدم Environment Variables:

```dart
class ApiConfig {
  static const String baseUrl = 
    String.fromEnvironment('API_URL', 
      defaultValue: 'http://localhost:8787'
    );
}
```

ثم شغل التطبيق:
```bash
flutter run --dart-define=API_URL=http://localhost:8787
```

---

## 🔧 **أوامر مفيدة**

### إدارة الحاويات:

```bash
# إيقاف جميع الخدمات
docker-compose -f docker-compose.dev.yml down

# إيقاف وحذف البيانات
docker-compose -f docker-compose.dev.yml down -v

# إعادة بناء الحاويات
docker-compose -f docker-compose.dev.yml build --no-cache

# تشغيل خدمة معينة
docker-compose -f docker-compose.dev.yml up -d postgres

# متابعة سجلات خدمة معينة
docker-compose -f docker-compose.dev.yml logs -f worker
```

### قاعدة البيانات:

```bash
# الدخول لـ PostgreSQL
docker exec -it mbuy-postgres psql -U postgres -d mbuy_dev

# عمل backup
docker exec mbuy-postgres pg_dump -U postgres mbuy_dev > backup.sql

# استعادة backup
docker exec -i mbuy-postgres psql -U postgres mbuy_dev < backup.sql

# مسح قاعدة البيانات وإعادة البناء
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d postgres
```

### Worker API:

```bash
# إعادة تشغيل Worker
docker-compose -f docker-compose.dev.yml restart worker

# الدخول لحاوية Worker
docker exec -it mbuy-worker sh

# تشغيل tests
docker exec mbuy-worker npm test

# تثبيت dependencies جديدة
docker exec mbuy-worker npm install package-name
```

### MinIO:

```bash
# إنشاء bucket جديد
docker exec mbuy-minio mc mb local/mbuy-dev

# رفع ملف
docker exec mbuy-minio mc cp /path/to/file local/mbuy-dev/
```

---

## 🧪 **اختبار API**

### باستخدام curl:

```bash
# Health Check
curl http://localhost:8787/health

# Get Products
curl http://localhost:8787/api/public/products

# Login (مثال)
curl -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"merchant@mbuy.dev","password":"password"}'
```

### باستخدام Postman:
1. استورد collection من `postman/mbuy-dev.json`
2. غيّر base URL إلى `http://localhost:8787`

---

## 🐛 **حل المشاكل**

### المشكلة: Worker لا يعمل

```bash
# تحقق من السجلات
docker-compose -f docker-compose.dev.yml logs worker

# تحقق من الاتصال بقاعدة البيانات
docker exec mbuy-postgres pg_isready -U postgres
```

### المشكلة: قاعدة البيانات فارغة

```bash
# تحقق من init script
docker-compose -f docker-compose.dev.yml logs postgres | grep "init"

# إعادة تشغيل مع حذف البيانات القديمة
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d
```

### المشكلة: تطبيق Flutter لا يتصل بالـ API

1. تأكد من أن Worker يعمل: `curl http://localhost:8787/health`
2. للاختبار على جهاز حقيقي، استخدم IP الجهاز بدلاً من localhost
3. تأكد من CORS في Worker

---

## 📊 **مراقبة الأداء**

### مراقبة موارد Docker:

```bash
# استخدام الموارد
docker stats

# حجم الحاويات
docker-compose -f docker-compose.dev.yml ps --size

# حجم الـ volumes
docker volume ls
docker volume inspect docker_postgres_data
```

---

## 🔐 **الأمان**

⚠️ **ملاحظات مهمة:**

1. هذه الإعدادات للتطوير المحلي فقط
2. **لا تستخدم** هذه الـ passwords في الإنتاج
3. **لا ترفع** ملف `.env.dev` لـ Git
4. غيّر جميع الـ secrets قبل النشر

---

## 🎯 **الخطوات التالية**

### 1️⃣ **تحميل AI Models (اختياري):**

```bash
# تحميل نموذج Llama 2
docker exec -it mbuy-ollama ollama pull llama2

# تحميل نموذج أصغر للتطوير
docker exec -it mbuy-ollama ollama pull phi
```

### 2️⃣ **إعداد n8n Workflows:**

1. افتح http://localhost:5678
2. أنشئ حساب مستخدم جديد
3. استورد workflows من `n8n-docker/workflows/`

### 3️⃣ **إعداد MinIO:**

1. افتح http://localhost:9001
2. سجل دخول (minioadmin/minioadmin)
3. أنشئ bucket باسم `mbuy-dev`

---

## 📚 **الموارد**

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)
- [MinIO Documentation](https://min.io/docs/)
- [Ollama Documentation](https://github.com/ollama/ollama)

---

## 🤝 **المساهمة**

لإضافة خدمة جديدة:

1. أضفها في `docker-compose.dev.yml`
2. حدث `.env.dev` بالمتغيرات المطلوبة
3. حدث هذا الملف بالتوثيق

---

## 📞 **الدعم**

إذا واجهت مشكلة:

1. تحقق من السجلات: `docker-compose logs`
2. تأكد من المنافذ غير مستخدمة
3. جرب إعادة بناء الحاويات

---

**مطور بـ ❤️ لمشروع MBUY**
