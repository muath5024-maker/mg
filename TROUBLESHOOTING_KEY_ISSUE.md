# 🔧 استكشاف أخطاء: مشكلة EDGE_INTERNAL_KEY

## ❌ المشكلة

الخطأ ما زال يظهر:
```
"Invalid internal key"
```

## ✅ الحلول المحتملة

### 1️⃣ التحقق من تطابق المفتاح

تأكد أن المفتاح **متطابق تماماً** في كلا المكانين:

#### في Supabase:
```bash
cd C:\muath\mbuy-backend
supabase secrets list
```

يجب أن ترى:
```
EDGE_INTERNAL_KEY  (set)
```

#### في Cloudflare:
```bash
cd C:\muath\mbuy-worker
wrangler secret list
```

يجب أن ترى:
```
EDGE_INTERNAL_KEY  (set)
```

---

### 2️⃣ إعادة تعيين المفتاح (إن لزم)

إذا كان هناك شك في تطابق المفتاح:

#### الخطوة 1: إنشاء مفتاح جديد قوي

```bash
# Windows PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

#### الخطوة 2: تعيينه في Supabase

```bash
cd C:\muath\mbuy-backend
supabase secrets set EDGE_INTERNAL_KEY=<المفتاح_الجديد>
```

#### الخطوة 3: تعيينه في Worker (نفس القيمة)

```bash
cd C:\muath\mbuy-worker
wrangler secret put EDGE_INTERNAL_KEY
# أدخل نفس المفتاح
```

#### الخطوة 4: إعادة النشر

```bash
# Edge Function
cd C:\muath\mbuy-backend
supabase functions deploy product_create

# Worker
cd C:\muath\mbuy-worker
wrangler deploy
```

---

### 3️⃣ التحقق من عدم وجود مسافات

تأكد أن المفتاح لا يحتوي على:
- مسافات في البداية أو النهاية
- أحرف مخفية
- رموز Unicode غير مرئية

**نصيحة:** استخدم مفتاحاً من أرقام وحروف إنجليزية فقط (a-z, A-Z, 0-9).

---

### 4️⃣ التحقق من Logs

#### Edge Function Logs (Supabase):
1. افتح Supabase Dashboard
2. اذهب إلى: Edge Functions → product_create → Logs
3. ابحث عن:
   ```
   [product_create] ❌ Invalid internal key
   ```

#### Worker Logs (Cloudflare):
1. افتح Cloudflare Dashboard
2. اذهب إلى: Workers & Pages → misty-mode-b68b → Logs
3. ابحث عن:
   ```
   [MBUY] Edge Function response status: 403
   ```

---

### 5️⃣ التحقق من Environment Variables

تأكد أن Edge Function يقرأ المفتاح بشكل صحيح:

في `product_create/index.ts` السطر 44:
```typescript
const internalKey = req.headers.get('x-internal-key');
if (!internalKey || internalKey !== Deno.env.get('EDGE_INTERNAL_KEY')) {
```

**تحقق:**
- Worker يرسل `x-internal-key` في headers ✅
- Edge Function يقرأه من `Deno.env.get('EDGE_INTERNAL_KEY')` ✅

---

## 🧪 اختبار سريع

بعد إعادة النشر، اختبر:

1. افتح التطبيق
2. سجّل الدخول كمستخدم تاجر
3. حاول إضافة منتج جديد

**النتيجة المتوقعة:**
- ✅ لا يظهر خطأ "Invalid internal key"
- ✅ المنتج يتم إضافته بنجاح

---

## 📝 ملاحظات مهمة

1. **المفتاح حساس لحالة الأحرف** - `Key123` ≠ `key123`
2. **لا توجد مسافات** - ` key ` ≠ `key`
3. **يجب أن يكون نفس المفتاح** في Supabase و Worker
4. **بعد تغيير المفتاح** - أعد نشر Edge Function و Worker

---

## ✅ Checklist

- [ ] المفتاح محدد في Supabase
- [ ] المفتاح محدد في Worker (نفس القيمة)
- [ ] لا توجد مسافات في المفتاح
- [ ] Edge Function منشور
- [ ] Worker منشور
- [ ] اختبر إضافة منتج

---

**آخر تحديث:** 6 يناير 2025

