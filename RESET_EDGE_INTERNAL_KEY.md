# 🔑 إعادة تعيين EDGE_INTERNAL_KEY

## ✅ الوضع الحالي

المفتاح موجود في كلا المكانين:
- ✅ Worker (Cloudflare): `EDGE_INTERNAL_KEY` موجود
- ✅ Supabase: `EDGE_INTERNAL_KEY` موجود

**المشكلة:** قد تكون القيم غير متطابقة.

---

## 🔧 الحل: إعادة تعيين المفتاح بنفس القيمة

### الخطوة 1: إنشاء مفتاح جديد قوي

#### Windows PowerShell:
```powershell
# توليد مفتاح قوي (32 حرف)
$newKey = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
Write-Host "المفتاح الجديد: $newKey"
Write-Host ""
Write-Host "⚠️ احفظ هذا المفتاح في مكان آمن!"
```

#### أو استخدم هذا المفتاح الجديد:
```
mbuy-secure-internal-key-2025-v1
```

**⚠️ مهم:** استخدم مفتاحاً قوياً عشوائياً في Production!

---

### الخطوة 2: تعيين المفتاح في Supabase

```bash
cd C:\muath\mbuy-backend

# استبدل <YOUR_KEY> بالمفتاح الذي أنشأته
supabase secrets set EDGE_INTERNAL_KEY=<YOUR_KEY>
```

**مثال:**
```bash
supabase secrets set EDGE_INTERNAL_KEY=mbuy-secure-internal-key-2025-v1
```

---

### الخطوة 3: تعيين نفس المفتاح في Worker

```bash
cd C:\muath\mbuy-worker

# سيطلب منك إدخال المفتاح
wrangler secret put EDGE_INTERNAL_KEY
```

**عند الطلب:**
- أدخل **نفس المفتاح** تماماً الذي استخدمته في Supabase
- اضغط Enter

---

### الخطوة 4: التحقق من التعيين

#### في Supabase:
```bash
cd C:\muath\mbuy-backend
supabase secrets list
```

يجب أن ترى:
```
EDGE_INTERNAL_KEY  | <DIGEST>
```

#### في Worker:
```bash
cd C:\muath\mbuy-worker
wrangler secret list
```

يجب أن ترى:
```json
{
  "name": "EDGE_INTERNAL_KEY",
  "type": "secret_text"
}
```

---

### الخطوة 5: إعادة النشر

```bash
# Edge Function
cd C:\muath\mbuy-backend
supabase functions deploy product_create

# Worker
cd C:\muath\mbuy-worker
wrangler deploy
```

---

### الخطوة 6: الاختبار

1. افتح التطبيق
2. سجّل الدخول كمستخدم تاجر
3. حاول إضافة منتج جديد

**النتيجة المتوقعة:**
- ✅ لا يظهر خطأ "Invalid internal key"
- ✅ المنتج يتم إضافته بنجاح

---

## ⚠️ ملاحظات مهمة

1. **المفتاح حساس لحالة الأحرف** - `Key123` ≠ `key123`
2. **لا توجد مسافات** - ` key ` ≠ `key`
3. **يجب أن يكون نفس المفتاح** في Supabase و Worker
4. **بعد تغيير المفتاح** - أعد نشر Edge Function و Worker
5. **لا تشارك المفتاح** - احتفظ به سراً

---

## 🎯 Quick Command (إذا كنت تريد تنفيذ سريع)

```powershell
# 1. توليد المفتاح
$key = "mbuy-secure-key-" + (-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 20 | ForEach-Object {[char]$_}))
Write-Host "المفتاح: $key"

# 2. تعيينه في Supabase (استبدل $key بالقيمة الفعلية)
cd C:\muath\mbuy-backend
# supabase secrets set EDGE_INTERNAL_KEY=$key

# 3. تعيينه في Worker (سيطلب إدخاله يدوياً)
cd C:\muath\mbuy-worker
# wrangler secret put EDGE_INTERNAL_KEY
```

---

**تاريخ:** 6 يناير 2025

