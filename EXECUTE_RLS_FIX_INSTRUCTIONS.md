# 📋 تعليمات تنفيذ إصلاح RLS و FORBIDDEN

## 🎯 الهدف
إصلاح مشكلة `FORBIDDEN` عند إضافة منتج جديد من تطبيق Flutter.

---

## 📁 الملف المطلوب تنفيذه

**الملف:** `mbuy-backend/migrations/20250106000003_fix_user_profiles_and_rls_policies.sql`

---

## 🚀 خطوات التنفيذ

### 1. افتح Supabase Dashboard
```
https://supabase.com/dashboard/project/sirqidofuvphqcxqchyc
```

### 2. اذهب إلى SQL Editor

### 3. انسخ محتوى الملف:
```
mbuy-backend/migrations/20250106000003_fix_user_profiles_and_rls_policies.sql
```

### 4. الصق في SQL Editor واضغط **Run**

### 5. انتظر حتى يظهر:
```
✅ جميع الإصلاحات تمت بنجاح!
```

---

## ✅ ما سيتم تنفيذه

### 1. إضافة الأعمدة المفقودة:
- ✅ `user_id UUID` → `auth.users(id)`
- ✅ `full_name TEXT`

### 2. تحديث البيانات:
- ✅ `user_id = id` لجميع الصفوف
- ✅ `full_name = display_name` للصفوف الموجودة
- ✅ جعل `user_id NOT NULL`

### 3. RLS Policies جديدة:
- ✅ `user_profiles`: SELECT, UPDATE, INSERT (باستخدام `user_id = auth.uid()`)
- ✅ `products`: INSERT, UPDATE, DELETE (للـ merchants فقط)
- ✅ `stores`: SELECT, ALL (باستخدام `user_profiles.user_id`)

---

## 🔍 التحقق بعد التنفيذ

### 1. التحقق من الأعمدة:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'user_profiles'
  AND column_name IN ('id', 'user_id', 'full_name', 'display_name');
```

**يجب أن ترى:**
- `id` (uuid, NOT NULL)
- `user_id` (uuid, NOT NULL) ✅
- `full_name` (text, nullable) ✅
- `display_name` (text, nullable)

### 2. التحقق من البيانات:
```sql
SELECT 
  id,
  user_id,
  id = user_id as "id_equals_user_id",
  display_name,
  full_name
FROM user_profiles
LIMIT 5;
```

**يجب أن ترى:**
- `id_equals_user_id` = `true` لجميع الصفوف ✅

### 3. التحقق من RLS Policies:
```sql
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('user_profiles', 'products', 'stores')
ORDER BY tablename, policyname;
```

**يجب أن ترى:**
- `user_profiles`: "Users can read own profile", "Users can update own profile", "Users can insert own profile"
- `products`: "Anyone can view active products", "Merchants insert their own products", "Merchants can update own products", "Merchants can delete own products"
- `stores`: "Anyone can view active stores", "Merchants can view own stores", "Merchants can manage own stores"

---

## 🧪 الاختبار بعد التنفيذ

### 1. افتح تطبيق Flutter

### 2. سجل دخول كتاجر (مع profile و store موجودين)

### 3. اذهب إلى شاشة المنتجات

### 4. اضغط على "إضافة منتج"

### 5. املأ البيانات واضغط "حفظ"

### النتيجة المتوقعة:
- ✅ لا يظهر خطأ `FORBIDDEN`
- ✅ يتم إنشاء المنتج بنجاح
- ✅ رسالة نجاح: "تم إضافة المنتج بنجاح!"
- ✅ ظهور المنتج في القائمة

---

## ⚠️ في حالة وجود أخطاء

### إذا ظهر خطأ أثناء Migration:
1. اقرأ رسالة الخطأ بعناية
2. تحقق من أن Supabase Dashboard متاح
3. تحقق من أن الجداول موجودة (`user_profiles`, `stores`, `products`)

### إذا استمر خطأ FORBIDDEN بعد Migration:
1. تحقق من أن `user_id` في `user_profiles` يساوي `id`
2. تحقق من أن `stores.owner_id` يشير إلى `user_profiles.id` الصحيح
3. تحقق من أن JWT token في Flutter صحيح (من `currentSession?.accessToken`)
4. تحقق من Logs في Worker و Edge Function

---

## 📊 ملخص التغييرات

### الأعمدة الجديدة:
- `user_profiles.user_id` (FK → auth.users.id)
- `user_profiles.full_name`

### RLS Policies المحدثة:
- `user_profiles`: تستخدم `user_id = auth.uid()`
- `products`: تستخدم JOIN مع `user_profiles` للتحقق من `user_id = auth.uid()`
- `stores`: تستخدم JOIN مع `user_profiles` للتحقق من `user_id = auth.uid()`

---

**جاهز للتنفيذ!** 🚀

