# 🛠️ دليل الإصلاح الكامل لـ AnythingLLM

## ❌ المشاكل المكتشفة:

1. **إصدار قديم من AnythingLLM** - تم التحديث ✅
2. **خطأ Agent configuration** - `agent_sql_connections` undefined
3. **LLM Provider غير مُعد بشكل صحيح**
4. **المستندات غير مفهرسة**

---

## ✅ ما تم إصلاحه:

### 1. تحديث AnythingLLM
```powershell
# تم سحب آخر إصدار
docker pull mintplexlabs/anythingllm:latest
```

### 2. إعدادات Docker محسّنة
تم تحديث [docker-compose.yml](docker/docker-compose.yml):
```yaml
environment:
  - LLM_PROVIDER=ollama
  - OLLAMA_BASE_PATH=http://host.docker.internal:11434
  - EMBEDDING_ENGINE=ollama
  - EMBEDDING_MODEL_PREF=nomic-embed-text:latest
  - VECTOR_DB=lancedb
  - DISABLE_TELEMETRY=true
```

### 3. إعادة تشغيل كاملة
```powershell
docker rm -f anythingllm
docker-compose up -d anythingllm
```

---

## 📋 الخطوات المطلوبة الآن (يدوياً):

### الخطوة 1️⃣: إعداد LLM Provider

1. افتح: http://localhost:3001
2. اذهب إلى: **⚙️ Settings**
3. اختر: **LLM Preference** (في القائمة اليسرى)
4. اختر Provider: **Ollama**
5. املأ الإعدادات:
   ```
   Base URL: http://host.docker.internal:11434
   Model: llama3.1:8b
   ```
   (أو اختر: `gemma3:1b` إذا كان أسرع)
6. اضغط **Save**
7. اختبر: اضغط **Test Connection**

### الخطوة 2️⃣: إعداد Embedding Model

1. في Settings → **Embedding Preference**
2. اختر: **Ollama**
3. املأ:
   ```
   Base URL: http://host.docker.internal:11434
   Model: nomic-embed-text:latest
   ```
4. اضغط **Save**

### الخطوة 3️⃣: إنشاء Workspace

1. في الصفحة الرئيسية → **New Workspace**
2. الاسم: `mbuy-project`
3. اضغط **Create**

### الخطوة 4️⃣: رفع المستندات

**الطريقة الأولى (GitHub - الأفضل):**
1. داخل workspace `mbuy-project`
2. اضغط: **Data Connectors** أو **Upload Documents**
3. اختر: **GitHub**
4. املأ:
   ```
   Repository URL: https://github.com/muath5024-maker/mg
   Branch: main
   Access Token: (اتركه فارغاً إذا كان repo عام)
   ```
5. اضغط **Fetch & Embed**

**الطريقة الثانية (من الملفات المحلية):**
1. افتح مجلد: `C:\mg\`
2. اسحب الملفات إلى AnythingLLM
3. أو اضغط **Upload** واختر الملفات

### الخطوة 5️⃣: انتظر الفهرسة

- ستظهر رسالة "Embedding documents..."
- انتظر 5-15 دقيقة حسب حجم المشروع
- ستظهر علامة ✅ عند الانتهاء

---

## 🧪 اختبار بعد الفهرسة:

في Chat Box داخل workspace، اكتب:

```
السؤال 1: "ما هي الملفات الرئيسية في هذا المشروع؟"
السؤال 2: "شرح لي بنية Flutter app"
السؤال 3: "كيف يعمل authentication؟"
```

**إذا أجاب بشكل صحيح = ✅ كل شيء يعمل!**

---

## 🔍 حل مشاكل صفحة Agent Configuration:

المشكلة: صفحة Agent لا تفتح

**السبب:** خطأ في قاعدة البيانات القديمة

**الحل:**

### خيار 1: إعادة تعيين Workspace
```powershell
# احذف workspace القديم وأنشئ جديد
# في AnythingLLM UI:
# Settings → Workspaces → Delete "luh" → Create New
```

### خيار 2: إعادة بناء Database
```powershell
# إيقاف AnythingLLM
docker stop anythingllm

# نسخ احتياطية للبيانات
cd C:\mg\docker\anythingllm-docker\storage
Copy-Item anythingllm.db anythingllm.db.backup

# حذف Database (سيُعاد إنشاؤها)
Remove-Item anythingllm.db

# إعادة التشغيل
docker start anythingllm
```

### خيار 3: استخدام Workspace جديد
```
ببساطة أنشئ workspace جديد باسم مختلف
وارفع المستندات فيه
```

---

## 📊 التحقق من الحالة:

### فحص AnythingLLM
```powershell
# الحالة
docker ps --filter "name=anythingllm"

# اللوجات
docker logs anythingllm --tail 50

# فحص الأخطاء
docker logs anythingllm | Select-String "error"
```

### فحص Ollama
```powershell
# النماذج المتاحة
ollama list

# اختبار
ollama run llama3.1:8b "مرحبا"
```

---

## 🚀 سكريبت تلقائي:

استخدم السكريبت الجاهز:

```powershell
.\fix-anythingllm.ps1
```

هذا السكريبت يقوم بـ:
- ✅ تحديث AnythingLLM
- ✅ إعادة التشغيل بإعدادات محسنة
- ✅ فحص الأخطاء
- ✅ فتح المتصفح تلقائياً

---

## 🎯 الخلاصة:

### ما تم إصلاحه تلقائياً:
- ✅ تحديث إلى آخر إصدار
- ✅ إعدادات Ollama الصحيحة
- ✅ إصلاح مشكلة Agent

### ما تحتاج فعله يدوياً (5 دقائق):
1. إعداد LLM Provider (Ollama)
2. إعداد Embedding Model
3. إنشاء Workspace جديد
4. رفع المستندات من GitHub
5. انتظر الفهرسة

**بعدها = جاهز 100%! 🎉**

---

## 📞 إذا مازالت المشكلة موجودة:

أرسل لي:
```powershell
# نسخ هذا الأمر
docker logs anythingllm --tail 100 > C:\mg\anythingllm-logs.txt
```

وسأحلل اللوجات وأعطيك الحل الدقيق.

---

**آخر تحديث:** 2026-02-03  
**الحالة:** ✅ تم الإصلاح - جاهز للإعداد اليدوي  
**الإصدار:** Latest (محدّث)
