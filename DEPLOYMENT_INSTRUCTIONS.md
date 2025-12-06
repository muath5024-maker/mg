# 🚀 تعليمات النشر: إصلاح FORBIDDEN Error

## ❌ المشكلة الحالية

الخطأ: `"Invalid internal key"`

السبب: `EDGE_INTERNAL_KEY` غير متطابق بين Worker و Edge Function.

---

## ✅ الحل: إعداد المفاتيح

### 1️⃣ إعداد Edge Function Secret في Supabase

```bash
cd C:\muath\mbuy-backend

# تأكد من أنك متصل بـ Supabase
supabase link --project-ref sirqidofuvphqcxqchyc

# قم بتعيين EDGE_INTERNAL_KEY (استخدم قيمة قوية)
supabase secrets set EDGE_INTERNAL_KEY=your-strong-random-key-here

# مثال (لا تستخدم هذا في Production):
# supabase secrets set EDGE_INTERNAL_KEY=mbuy-secure-internal-key-2025
```

**⚠️ مهم:** احفظ القيمة في مكان آمن - ستحتاجها للخطوة التالية.

---

### 2️⃣ إعداد Worker Secret في Cloudflare

```bash
cd C:\muath\mbuy-worker

# قم بتعيين نفس القيمة في Worker
wrangler secret put EDGE_INTERNAL_KEY

# سيطلب منك إدخال القيمة
# أدخل نفس القيمة التي استخدمتها في Supabase
```

**⚠️ مهم:** يجب أن تكون القيمة **نفسها تماماً** في كلا المكانين.

---

### 3️⃣ نشر Edge Function

```bash
cd C:\muath\mbuy-backend

# نشر function محدث
supabase functions deploy product_create
```

---

### 4️⃣ نشر Worker

```bash
cd C:\muath\mbuy-worker

# نشر Worker محدث
wrangler deploy
```

---

### 5️⃣ التحقق من النشر

بعد النشر، اختبر إضافة منتج:

1. افتح التطبيق
2. سجّل الدخول كمستخدم تاجر
3. حاول إضافة منتج جديد

**النتيجة المتوقعة:**
- ✅ لا يظهر خطأ "Invalid internal key"
- ✅ المنتج يتم إضافته بنجاح

---

## 🔍 التحقق من المفاتيح

### في Supabase:
```bash
cd C:\muath\mbuy-backend
supabase secrets list
```

يجب أن ترى:
```
EDGE_INTERNAL_KEY  (set)
```

### في Cloudflare:
```bash
cd C:\muath\mbuy-worker
wrangler secret list
```

يجب أن ترى:
```
EDGE_INTERNAL_KEY  (set)
```

---

## ⚠️ ملاحظات مهمة

1. **لا تشارك المفاتيح:** `EDGE_INTERNAL_KEY` يجب أن يبقى سرياً
2. **استخدم قيم قوية:** استخدم مفتاح عشوائي قوي (مثلاً 32+ حرف)
3. **التطابق مطلوب:** القيمة يجب أن تكون **نفسها** في Worker و Edge Function
4. **إعادة النشر:** بعد تغيير المفاتيح، أعد نشر Edge Function و Worker

---

## 🔐 توليد مفتاح قوي

يمكنك استخدام هذا الأمر لتوليد مفتاح قوي:

### Windows PowerShell:
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

### Linux/Mac:
```bash
openssl rand -hex 32
```

---

## ✅ Checklist

- [ ] `EDGE_INTERNAL_KEY` محدد في Supabase
- [ ] `EDGE_INTERNAL_KEY` محدد في Cloudflare Worker (نفس القيمة)
- [ ] Edge Function `product_create` منشور
- [ ] Worker منشور
- [ ] اختبار إضافة منتج ناجح

---

**تاريخ:** 6 يناير 2025

