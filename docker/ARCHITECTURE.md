# 📊 بنية MBUY - Development vs Production

## 🎯 ملخص التحول

### **في الإنتاج (Production):**
```
Flutter App
    ↓
Cloudflare Worker (API Gateway)
    ↓
Supabase PostgreSQL
```

### **في التطوير (Development):**
```
Flutter App (localhost)
    ↓
Worker محلي في Docker (localhost:8787)
    ↓
PostgreSQL محلي في Docker (localhost:5432)
    ↓
Redis محلي (localhost:6379)
```

---

## 📦 **مكونات البيئة التطويرية**

### 1️⃣ **PostgreSQL (قاعدة البيانات)**

**بديل عن:** Supabase PostgreSQL

**الوصول:**
- Host: `localhost`
- Port: `5432`
- User: `postgres`
- Password: `postgres123`
- Database: `mbuy_dev`

**الميزات:**
✅ Schema تلقائي عند التشغيل الأول
✅ بيانات تجريبية جاهزة
✅ Triggers & Functions
✅ Indexes للأداء

**الجداول الموجودة:**
- `users` - المستخدمين (تجار + عملاء)
- `stores` - المتاجر
- `products` - المنتجات
- `orders` - الطلبات

---

### 2️⃣ **Worker API (Backend)**

**بديل عن:** Cloudflare Worker

**الوصول:**
- URL: `http://localhost:8787`

**التغييرات المطلوبة في Worker:**

في ملف `mbuy-worker/src/index.ts`:

```typescript
// إضافة support للـ PostgreSQL المحلي
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 
    'postgresql://postgres:postgres123@postgres:5432/mbuy_dev'
});

// بدلاً من Supabase Client
```

**في ملف `mbuy-worker/package.json`:**

```json
{
  "scripts": {
    "dev": "NODE_ENV=development node --watch src/index.ts",
    "dev:docker": "NODE_ENV=development node src/index.ts"
  }
}
```

---

### 3️⃣ **Redis (Caching & Sessions)**

**بديل عن:** Cloudflare KV

**الوصول:**
- Host: `localhost`
- Port: `6379`

**الاستخدام:**

```typescript
// في Worker
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379
});

// Cache مثال
await redis.set('products:trending', JSON.stringify(products), 'EX', 3600);
```

---

### 4️⃣ **MinIO (Object Storage)**

**بديل عن:** Cloudflare R2 / AWS S3

**الوصول:**
- API: `http://localhost:9000`
- Console: `http://localhost:9001`
- Access Key: `minioadmin`
- Secret Key: `minioadmin`

**الاستخدام:**

```typescript
// في Worker
import { S3Client } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
  credentials: {
    accessKeyId: 'minioadmin',
    secretAccessKey: 'minioadmin'
  },
  region: 'us-east-1',
  forcePathStyle: true // مهم للـ MinIO
});
```

---

### 5️⃣ **Adminer (Database UI)**

**الوصول:**
- URL: `http://localhost:8080`

**الاستخدام:**
1. اختر `PostgreSQL`
2. Server: `postgres`
3. Username: `postgres`
4. Password: `postgres123`
5. Database: `mbuy_dev`

---

## 🔄 **تعديل Flutter للتطوير المحلي**

### الطريقة الأولى: تعديل مباشر

**ملف:** `mbuy/lib/core/config/api_config.dart`

```dart
class ApiConfig {
  // ===== للتطوير المحلي =====
  static const String baseUrl = 'http://localhost:8787';
  
  // ===== للاختبار على جهاز حقيقي =====
  // احصل على IP جهازك من: ipconfig (Windows) أو ifconfig (Mac/Linux)
  // static const String baseUrl = 'http://192.168.1.100:8787';
  
  // ===== للإنتاج =====
  // static const String baseUrl = 'https://misty-mode-b68b.baharista1.workers.dev';
}
```

### الطريقة الثانية: Environment Variables (أفضل)

**ملف:** `mbuy/lib/core/config/api_config.dart`

```dart
class ApiConfig {
  static const String baseUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://localhost:8787', // للتطوير
  );
  
  static const String environment = String.fromEnvironment(
    'ENVIRONMENT',
    defaultValue: 'development',
  );
  
  static bool get isDevelopment => environment == 'development';
  static bool get isProduction => environment == 'production';
}
```

**التشغيل:**

```bash
# للتطوير
flutter run --dart-define=API_URL=http://localhost:8787 --dart-define=ENVIRONMENT=development

# للإنتاج
flutter run --dart-define=API_URL=https://misty-mode-b68b.baharista1.workers.dev --dart-define=ENVIRONMENT=production
```

**أو أنشئ ملف:** `mbuy/launch.json`

```json
{
  "configurations": [
    {
      "name": "Development",
      "type": "dart",
      "args": [
        "--dart-define=API_URL=http://localhost:8787",
        "--dart-define=ENVIRONMENT=development"
      ]
    },
    {
      "name": "Production",
      "type": "dart",
      "args": [
        "--dart-define=API_URL=https://misty-mode-b68b.baharista1.workers.dev",
        "--dart-define=ENVIRONMENT=production"
      ]
    }
  ]
}
```

---

## 🚀 **سيناريو التطوير الكامل**

### خطوة 1: تشغيل Docker

```bash
cd C:\mg\docker

# في Windows
start-dev.bat

# أو يدوياً
docker-compose -f docker-compose.dev.yml up -d
```

### خطوة 2: التحقق من الخدمات

```bash
# التحقق من حالة الحاويات
docker-compose -f docker-compose.dev.yml ps

# يجب أن ترى:
# ✅ mbuy-postgres    (healthy)
# ✅ mbuy-redis       (healthy)
# ✅ mbuy-worker      (running)
# ✅ mbuy-minio       (running)
```

### خطوة 3: اختبار API

```bash
# Health Check
curl http://localhost:8787/health

# يجب أن ترى: {"status":"ok"}
```

### خطوة 4: اختبار قاعدة البيانات

```bash
# الاتصال بقاعدة البيانات
docker exec -it mbuy-postgres psql -U postgres -d mbuy_dev

# داخل PostgreSQL
\dt              # عرض الجداول
SELECT * FROM users;
SELECT * FROM stores;
\q               # خروج
```

### خطوة 5: تشغيل Flutter

```bash
cd C:\mg\mbuy

# تعديل api_config.dart أولاً
# ثم:
flutter run
```

---

## 📊 **مقارنة تفصيلية**

| المكون | الإنتاج | التطوير | الملاحظات |
|--------|---------|---------|-----------|
| **Backend** | Cloudflare Worker | Node.js في Docker | نفس الكود، بيئة مختلفة |
| **Database** | Supabase PostgreSQL | PostgreSQL في Docker | نفس SQL، سيرفر مختلف |
| **Cache** | Cloudflare KV | Redis | API مختلف قليلاً |
| **Storage** | Cloudflare R2 | MinIO | S3-compatible |
| **AI** | Cloudflare AI | Ollama | نماذج مختلفة |
| **التكلفة** | $$$ | مجاني | - |
| **السرعة** | سريع جداً | عادي | - |
| **التطوير** | صعب | سهل جداً | ✅ |

---

## 🎓 **مثال عملي كامل**

### الكود في Worker (يعمل في البيئتين):

```typescript
// src/db.ts
import { Pool } from 'pg';
import { createClient } from '@supabase/supabase-js';

export function getDatabase() {
  if (process.env.NODE_ENV === 'development') {
    // استخدم PostgreSQL المحلي
    return new Pool({
      connectionString: process.env.DATABASE_URL
    });
  } else {
    // استخدم Supabase في الإنتاج
    return createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_KEY!
    );
  }
}
```

```typescript
// src/routes/products.ts
import { getDatabase } from '../db';

export async function getProducts() {
  const db = getDatabase();
  
  if (process.env.NODE_ENV === 'development') {
    const result = await db.query('SELECT * FROM products');
    return result.rows;
  } else {
    const { data } = await db.from('products').select('*');
    return data;
  }
}
```

---

## 🔐 **الأمان**

⚠️ **تحذيرات مهمة:**

1. ❌ **لا تستخدم** بيانات الاعتماد هذه في الإنتاج
2. ❌ **لا ترفع** `.env.dev` للـ Git
3. ✅ **استخدم** متغيرات بيئة مختلفة لكل بيئة
4. ✅ **فعّل** SSL في الإنتاج

---

## ✅ **الخلاصة**

### ما يصبح عليه الـ Backend:

```
قبل: Cloudflare Worker (في السحابة)
بعد: Node.js Worker (في Docker على جهازك)
```

### ما تصبح عليه قاعدة البيانات:

```
قبل: Supabase PostgreSQL (في السحابة)
بعد: PostgreSQL (في Docker على جهازك)
```

### الفائدة:

✅ تطوير بدون اتصال إنترنت
✅ تطوير أسرع (لا latency)
✅ اختبار محلي كامل
✅ تكلفة صفر
✅ بيانات تجريبية كاملة
✅ إعادة تشغيل سريعة

---

**جاهز للتطوير! 🚀**
