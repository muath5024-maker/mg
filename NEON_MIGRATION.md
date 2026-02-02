# 🔄 تغيير من Supabase إلى Neon Database

## لماذا Neon؟

| الميزة | Supabase | Neon |
|--------|----------|------|
| **Free Tier** | 500MB + 2GB Egress | 3GB + Unlimited compute hours |
| **Cold Start** | ~2-3s | <1s (أسرع) |
| **Branching** | ❌ | ✅ (للتطوير) |
| **Autoscaling** | محدود | ✅ تلقائي |
| **التكلفة** | $25/month بعد Free | أرخص |

---

## 📝 خطوات التغيير:

### 1️⃣ إنشاء حساب Neon (مجاني):
```
https://neon.tech
```

### 2️⃣ إنشاء Project جديد:
- اسم المشروع: `mbuy-production`
- Region: `AWS US East (Ohio)` (الأقرب)
- PostgreSQL Version: `16`

### 3️⃣ الحصول على Connection String:
```
postgresql://[user]:[password]@[endpoint].neon.tech/[database]
```

مثال:
```
postgresql://mbuy_user:AbCd1234@ep-cool-name-123456.us-east-2.aws.neon.tech/mbuy_db
```

---

## 🔧 الملفات المطلوب تعديلها:

### 1. Worker Environment Variables:
**الملف:** `mbuy-worker/wrangler.jsonc`

```jsonc
{
  "vars": {
    // غير هذا:
    "SUPABASE_URL": "https://xxx.supabase.co",
    "SUPABASE_SERVICE_ROLE_KEY": "xxx",
    
    // إلى:
    "DATABASE_URL": "postgresql://user:pass@ep-xxx.neon.tech/mbuydb"
  }
}
```

### 2. Docker Development:
**الملف:** `docker/.env.dev`

```bash
# غير من:
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# إلى:
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/mbuydb
# أو للتطوير المحلي:
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/mbuy_dev
```

### 3. Worker Code:
**الملف:** `mbuy-worker/src/utils/supabase.ts`

**قبل (Supabase Client):**
```typescript
import { createClient } from '@supabase/supabase-js';

export function createSupabaseClient(env: Env) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
}
```

**بعد (Direct PostgreSQL):**
```typescript
import { Pool } from 'pg';

export function createDatabaseClient(env: Env) {
  return new Pool({
    connectionString: env.DATABASE_URL,
  });
}
```

---

## ⚡ الترحيل (Migration):

### نسخ البيانات من Local إلى Neon:

```powershell
# 1. Export من PostgreSQL المحلي
docker exec mbuy-postgres pg_dump -U postgres mbuy_dev > mbuy_backup.sql

# 2. Import إلى Neon
psql "postgresql://user:pass@ep-xxx.neon.tech/mbuydb" < mbuy_backup.sql
```

---

## 🎯 الملخص السريع:

**للتطوير:** 
- استمر بـ PostgreSQL المحلي ✅

**للإنتاج:**
- بدّل `DATABASE_URL` إلى Neon ✅
- احذف dependencies لـ `@supabase/supabase-js`
- استخدم `pg` أو `postgres.js` مباشرة

---

**هل تبغى:**
- [ ] أسجل لك حساب Neon وأجيب Connection String؟
- [ ] أعدل الملفات الحين عشان تدعم الاثنين (Supabase + Neon)؟
- [ ] نترك Supabase كما هو مؤقتاً؟
