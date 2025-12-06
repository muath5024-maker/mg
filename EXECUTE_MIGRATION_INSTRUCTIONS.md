# 📋 تعليمات تنفيذ Migration

## ✅ ملف Migration جاهز

**الملف:** `mbuy-backend/migrations/20250106000001_add_missing_tables_and_fixes.sql`

---

## 🚀 طريقة التنفيذ

### الطريقة 1: Supabase SQL Editor (الأسهل)

1. افتح Supabase Dashboard:
   - https://supabase.com/dashboard/project/sirqidofuvphqcxqchyc

2. اذهب إلى **SQL Editor**

3. انسخ محتوى الملف:
   ```
   mbuy-backend/migrations/20250106000001_add_missing_tables_and_fixes.sql
   ```

4. الصق في SQL Editor

5. اضغط **Run** أو `Ctrl+Enter`

6. تأكد من رسالة النجاح:
   ```
   ✅ تم إنشاء الجداول المفقودة وإصلاح المشاكل بنجاح!
   ```

---

### الطريقة 2: Supabase CLI

```bash
cd C:\muath\mbuy-backend
supabase db push
```

أو:

```bash
cd C:\muath\mbuy-backend
supabase db execute --file migrations/20250106000001_add_missing_tables_and_fixes.sql
```

---

## ✅ ما سيتم تنفيذه

### 1. إنشاء 3 جداول جديدة:
- ✅ `wishlist`
- ✅ `recently_viewed`
- ✅ `product_variants`

### 2. إصلاحات:
- ✅ توحيد استخدام `stock` (حذف `stock_quantity` إذا كان موجوداً)
- ✅ إضافة `merchant_owner_id` إلى `conversations`
- ✅ إضافة CHECK constraints

### 3. تحديث Function:
- ✅ تحديث `decrement_stock()` لاستخدام `stock`

---

## 🔍 التحقق من النجاح

بعد التنفيذ، تحقق من:

```sql
-- التحقق من الجداول الجديدة
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('wishlist', 'recently_viewed', 'product_variants');

-- يجب أن ترى 3 جداول
```

---

## ⚠️ ملاحظات

- ✅ Migration آمن - يستخدم `IF NOT EXISTS` و `IF EXISTS`
- ✅ لن يحذف بيانات موجودة
- ✅ يمكن تنفيذه عدة مرات بأمان

---

**جاهز للتنفيذ!** 🚀

