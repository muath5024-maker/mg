# ⚡ إعادة تعيين سريعة: EDGE_INTERNAL_KEY

## 📝 الخطوات السريعة

### 1️⃣ اختر مفتاحاً جديداً

**خيار 1:** استخدم هذا المفتاح:
```
mbuy-internal-key-2025-secure
```

**خيار 2:** أنشئ مفتاحاً جديداً (PowerShell):
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

---

### 2️⃣ عيّن المفتاح في Supabase

```bash
cd C:\muath\mbuy-backend
supabase secrets set EDGE_INTERNAL_KEY=mbuy-internal-key-2025-secure
```

**⚠️ استبدل `mbuy-internal-key-2025-secure` بالمفتاح الذي تريد استخدامه**

---

### 3️⃣ عيّن نفس المفتاح في Worker

```bash
cd C:\muath\mbuy-worker
wrangler secret put EDGE_INTERNAL_KEY
```

**عند الطلب:** أدخل نفس المفتاح تماماً من الخطوة 2

---

### 4️⃣ أعد النشر

```bash
# Edge Function
cd C:\muath\mbuy-backend
supabase functions deploy product_create

# Worker
cd C:\muath\mbuy-worker
wrangler deploy
```

---

### 5️⃣ اختبر

افتح التطبيق وجرب إضافة منتج جديد.

---

**✅ تم!**

