# ✅ Migration جاهز للتنفيذ

## 📋 الملف

**الملف:** `mbuy-backend/migrations/20250106000001_add_missing_tables_and_fixes.sql`

---

## 🚀 خطوات التنفيذ

### 1. افتح Supabase Dashboard
https://supabase.com/dashboard/project/sirqidofuvphqcxqchyc

### 2. اذهب إلى SQL Editor

### 3. انسخ محتوى الملف:
```
mbuy-backend/migrations/20250106000001_add_missing_tables_and_fixes.sql
```

### 4. الصق في SQL Editor واضغط Run

---

## ✅ ما سيتم تنفيذه

### الجداول الجديدة (3):
1. ✅ `wishlist`
2. ✅ `recently_viewed`
3. ✅ `product_variants`

### الإصلاحات:
1. ✅ توحيد `stock` (حذف `stock_quantity`)
2. ✅ إضافة `merchant_owner_id` إلى `conversations`
3. ✅ إضافة CHECK constraints (8 constraints)

---

## 🔍 التحقق

بعد التنفيذ، شغل:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('wishlist', 'recently_viewed', 'product_variants');
```

**يجب أن ترى 3 جداول!**

---

**ملاحظة:** تم أيضاً إصلاح خطأ في `ApiService` يتعلق بمعالجة error codes.

---

**جاهز!** 🚀

