# تقرير تنظيف ومراجعة Worker - Mbuy Project

## التاريخ: يناير 2025

## الهدف
تنظيف ومراجعة مشروع Worker بالكامل بناءً على مخطط قاعدة البيانات الحالي في Supabase والتعديلات الأخيرة في Flutter.

---

## الملفات المعدلة

### 1. `mbuy-worker/src/index.ts`
**التعديلات الرئيسية**:

#### أ) إضافة Helper Functions:
- **`getUuidParam(c, paramName)`**: دالة مساعدة لاستخراج UUID params بشكل آمن
- **`sanitizeError(error)`**: دالة لتنظيف رسائل الأخطاء وإخفاء التفاصيل الحساسة

#### ب) توحيد التعامل مع UUID:
- ✅ جميع `c.req.param('id')` تم استبدالها بـ `getUuidParam(c, 'id')`
- ✅ جميع IDs تم إضافة type casting `as string` للتأكد أنها UUIDs
- ✅ إزالة أي استخدام لـ `Number()` أو `parseInt()` على IDs

#### ج) مطابقة أسماء الأعمدة مع Schema:
- ✅ **orders**: تم تغيير `user_id` إلى `customer_id` في جميع الاستعلامات
- ✅ **reviews**: تم تغيير `user_id` إلى `customer_id` في إنشاء reviews
- ✅ **order_items**: تم تغيير `price` إلى `unit_price` (يطابق Schema)
- ✅ **cart_items**: تم إزالة الاعتماد على `cart_id` واستخدام `user_id` مباشرة

#### د) تنظيف Body قبل الكتابة في Supabase:
- ✅ **Create Product** (`POST /secure/products`):
  - حذف: `id`, `product_id`, `store_id`, `user_id`, `owner_id`, `created_at`, `updated_at`
- ✅ **Update Product** (`PUT /secure/products/:id`):
  - نفس الحقول المحذوفة
- ✅ **Update Store** (`PUT /secure/stores/:id`):
  - حذف: `id`, `store_id`, `owner_id`, `user_id`, `created_at`, `updated_at`

#### هـ) إصلاحات Create Order:
- ✅ إزالة الاعتماد على `cart_id` من body
- ✅ استخدام `user_id` مباشرة من JWT لجلب cart_items
- ✅ جلب `store_id` من أول منتج في السلة تلقائياً
- ✅ إضافة `store_id` إلى order عند الإنشاء

#### و) إصلاحات Cart:
- ✅ جلب `store_id` من المنتج تلقائياً إذا لم يتم إرساله
- ✅ استخدام `user_id` بدلاً من `cart_id`

#### ز) إصلاحات Reviews:
- ✅ استخدام `customer_id` بدلاً من `user_id`
- ✅ جلب `store_id` من المنتج تلقائياً إذا لم يتم إرساله

#### ح) إصلاحات Order Status History:
- ✅ إضافة type casting لجميع UUIDs في `order_status_history`

---

### 2. `mbuy-worker/src/middleware/validation.ts`
**التعديلات**:
- ✅ **CreateOrderFromCartSchema**: إزالة `cart_id` من Schema (لم يعد مطلوباً)

---

### 3. `mbuy-worker/src/utils/supabase.ts`
**التعديلات**:
- ✅ **`update()`**: إضافة type casting لـ `id` كـ string
- ✅ **`findById()`**: إضافة type casting لـ `id` كـ string

---

## التغييرات التفصيلية

### 1. توحيد التعامل مع UUID

#### قبل:
```typescript
const productId = c.req.param('id');
const storeId = c.req.param('id');
```

#### بعد:
```typescript
const productId = getUuidParam(c, 'id'); // string (UUID)
const storeId = getUuidParam(c, 'id'); // string (UUID)
```

---

### 2. مطابقة أسماء الأعمدة

#### orders:
- **قبل**: `user_id=eq.${userId}`
- **بعد**: `customer_id=eq.${userId}`

#### reviews:
- **قبل**: `user_id: userId`
- **بعد**: `customer_id: userId as string`

#### order_items:
- **قبل**: `price: item.products?.price || 0`
- **بعد**: `unit_price: item.products?.price || 0`

---

### 3. تنظيف Body

#### Create Product:
```typescript
const cleanBody: any = { ...body };
delete cleanBody.id;
delete cleanBody.product_id;
delete cleanBody.store_id;
delete cleanBody.user_id;
delete cleanBody.owner_id;
delete cleanBody.created_at;
delete cleanBody.updated_at;
```

#### Update Product/Store:
- نفس المنطق

---

### 4. Create Order من Cart

#### قبل:
```typescript
const { cart_id, ... } = body;
const cartItems = await fetch(`...cart_items?cart_id=eq.${cart_id}...`);
```

#### بعد:
```typescript
// cart_id no longer required
const cartItems = await fetch(`...cart_items?user_id=eq.${userId}...`);
// Get store_id from first item's product
const storeId = firstItem.products.store_id;
// Add store_id to order
body: JSON.stringify({
  customer_id: userId as string,
  store_id: storeId as string,
  ...
})
```

---

### 5. Cart Operations

#### Add to Cart:
```typescript
// Get store_id from product if not provided
let storeId = body.store_id;
if (!storeId && body.product_id) {
  const productResponse = await fetch(`...products?id=eq.${body.product_id}&select=store_id`);
  const products = await productResponse.json();
  storeId = products?.[0]?.store_id;
}
```

---

### 6. Reviews

#### Create Review:
```typescript
// Use customer_id instead of user_id
const reviewData = {
  customer_id: userId as string, // UUID from JWT
  product_id: body.product_id as string, // UUID
  store_id: storeId as string, // UUID (fetched from product if not provided)
  ...
};
```

---

## الحقول التي تم تنظيفها من Body

### في Create/Update Product:
- `id`
- `product_id`
- `store_id`
- `user_id`
- `owner_id`
- `created_at`
- `updated_at`

### في Create/Update Store:
- `id`
- `store_id`
- `owner_id`
- `user_id`
- `created_at`
- `updated_at`

---

## الحقول التي يضيفها Worker تلقائياً

### في Create Order:
- `customer_id`: من JWT (`userId`)
- `store_id`: من أول منتج في السلة

### في Add to Cart:
- `user_id`: من JWT (`userId`)
- `store_id`: من المنتج إذا لم يتم إرساله

### في Create Review:
- `customer_id`: من JWT (`userId`)
- `store_id`: من المنتج إذا لم يتم إرساله

---

## التوافق مع Flutter

### ✅ تم إزالة الاعتماد على:
- `cart_id` في Create Order (Flutter لا يرسله الآن)
- `store_id` في Add to Cart (Worker يجلبها من المنتج)

### ✅ تم إضافة:
- جلب `store_id` تلقائياً من المنتج في Cart و Reviews
- استخدام `user_id` مباشرة من JWT بدلاً من `cart_id`

---

## التحقق من الأخطاء

### ✅ تم إضافة:
- Helper function `sanitizeError()` لتنظيف رسائل الأخطاء
- معالجة خاصة لأخطاء PostgreSQL (22P02, foreign key violations)
- إخفاء stack traces في الإنتاج

---

## الملخص

### الملفات المعدلة (3):
1. `mbuy-worker/src/index.ts` - التعديلات الرئيسية
2. `mbuy-worker/src/middleware/validation.ts` - إزالة `cart_id` من Schema
3. `mbuy-worker/src/utils/supabase.ts` - Type casting للـ UUIDs

### التغييرات الرئيسية:
- ✅ توحيد التعامل مع UUID (string فقط)
- ✅ مطابقة أسماء الأعمدة مع Schema (`customer_id`, `unit_price`)
- ✅ تنظيف Body قبل الكتابة في Supabase
- ✅ إزالة الاعتماد على `cart_id`
- ✅ جلب `store_id` تلقائياً من المنتج
- ✅ إضافة Helper functions للـ UUIDs والأخطاء

---

**تاريخ الإصلاح**: يناير 2025  
**الحالة**: ✅ تم التنفيذ

