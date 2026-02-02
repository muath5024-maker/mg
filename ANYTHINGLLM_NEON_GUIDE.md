# 📚 دليل استخدام AnythingLLM + Neon

## ✅ ما تم إنجازه:

### 1️⃣ رفع المشروع لـ AnythingLLM
```
✅ Flutter files: نُسخت إلى collector/mbuy-project/flutter/
✅ Worker files: نُسخت إلى collector/mbuy-project/worker/
✅ Project info: README.md موجود في المجلد
```

**الموقع:**
```
C:\mg\docker\anythingllm-docker\collector\mbuy-project\
├── flutter\       (ملفات Dart)
├── worker\        (ملفات TypeScript)
└── README.md      (نظرة عامة)
```

---

## 🔧 كيف تستخدم AnythingLLM:

### الطريقة 1: عبر الواجهة (UI)

1. **افتح:** http://localhost:3001
2. **اذهب إلى:** Workspace "luh" (الموجود)
3. **اضغط:** "Upload Documents"
4. **اختر:** المسار `collector/mbuy-project`
5. **انتظر:** المعالجة والفهرسة
6. **اسأل:** "ما هو هيكل المشروع؟"

### الطريقة 2: تحديث تلقائي

AnythingLLM يراقب مجلد `collector/` تلقائياً!

```powershell
# كل ما تحدث ملف، انسخه:
Copy-Item "C:\mg\mbuy\lib\features\auth\*.dart" "C:\mg\docker\anythingllm-docker\collector\mbuy-project\flutter\features\auth\" -Recurse -Force
```

---

## 🎯 استخدامات AnythingLLM:

**أسئلة يمكنك طرحها:**
```
- "وين موجود كود تسجيل الدخول؟"
- "كيف يتم المصادقة في Worker?"
- "ما هي جداول قاعدة البيانات؟"
- "اشرح لي بنية المشروع"
- "كيف أضيف feature جديدة؟"
```

**مميزات:**
✅ يفهم الكود Dart + TypeScript
✅ يربط بين Frontend و Backend
✅ يعطيك أمثلة من الكود الموجود
✅ يقترح تحسينات

---

## 🔄 تغيير إلى Neon Database:

### خطوة 1: إنشاء حساب
```
1. اذهب إلى: https://neon.tech
2. سجل دخول بـ GitHub
3. اضغط "Create Project"
```

### خطوة 2: إعدادات المشروع
```
Project Name: mbuy-production
Region: AWS US East (Ohio)
PostgreSQL: 16
```

### خطوة 3: الحصول على Connection String
```
Dashboard → Connect → Connection String

مثال:
postgresql://mbuy_owner:npg_xxx@ep-cool-name-123456.us-east-2.aws.neon.tech/mbuy_db?sslmode=require
```

### خطوة 4: التعديلات المطلوبة

#### ملف 1: `docker/.env.dev`
```bash
# أضف هذا السطر:
NEON_DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/mbuy_db

# اترك المحلي للتطوير:
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/mbuy_dev
```

#### ملف 2: `mbuy-worker/wrangler.jsonc`
```jsonc
{
  "vars": {
    "DATABASE_URL": "postgresql://user:pass@ep-xxx.neon.tech/mbuy_db",
    // احذف Supabase:
    // "SUPABASE_URL": "...",
    // "SUPABASE_SERVICE_ROLE_KEY": "..."
  }
}
```

#### ملف 3: `mbuy-worker/src/utils/database.ts`
```typescript
// أنشئ ملف جديد:
import { Pool } from 'pg';

export function createDatabasePool(env: Env) {
  return new Pool({
    connectionString: env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // Neon يحتاج SSL
  });
}
```

---

## 📊 مقارنة سريعة:

| الميزة | PostgreSQL محلي | Supabase | Neon |
|--------|----------------|----------|------|
| **للتطوير** | ✅ الأفضل | ✅ جيد | ✅ جيد |
| **للإنتاج** | ❌ | ✅ | ✅ الأفضل |
| **التكلفة** | مجاني (محلي) | $25/month | Free tier سخي |
| **السرعة** | سريع جداً | جيد | سريع |
| **Features** | عادي | Auth + Storage | Database فقط |

---

## 🚀 الخلاصة:

**تم:**
✅ رفع المشروع لـ AnythingLLM
✅ شرح طريقة الاستخدام
✅ دليل التغيير إلى Neon

**الخطوة التالية:**
1. جرب AnythingLLM: http://localhost:3001
2. إذا عجبك Neon، سجل وجيب Connection String
3. بدل في الملفات وجرب

**أسئلة؟** 💬
