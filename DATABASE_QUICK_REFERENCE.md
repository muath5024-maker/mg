# 📋 مرجع سريع - قاعدة بيانات MBUY

## 📊 إحصائيات

- **إجمالي الجداول:** 25 جدول
- **إجمالي العلاقات:** 30+ علاقة
- **إجمالي الفهارس:** 50+ فهرس

---

## 🔗 السلسلة الأساسية

```
auth.users
  ↓ (1:1)
user_profiles
  ↓ (1:N)
stores
  ↓ (1:N)
products
```

---

## 📋 قائمة الجداول

### Core Tables (6)
1. `user_profiles` - ملفات المستخدمين
2. `stores` - المتاجر
3. `products` - المنتجات
4. `categories` - الفئات
5. `product_categories` - ربط المنتجات بالفئات
6. `product_media` - صور المنتجات

### Shopping Tables (4)
7. `carts` - السلة
8. `cart_items` - عناصر السلة
9. `orders` - الطلبات
10. `order_items` - عناصر الطلب

### Financial Tables (4)
11. `wallets` - المحافظ
12. `wallet_transactions` - معاملات المحفظة
13. `points_accounts` - حسابات النقاط
14. `points_transactions` - معاملات النقاط

### Marketing Tables (5)
15. `feature_actions` - الميزات المدفوعة
16. `coupons` - الكوبونات
17. `coupon_redemptions` - استخدام الكوبونات
18. `stories` - قصص المتاجر
19. `packages` - الباقات

### Social Tables (4)
20. `favorites` - المفضلة
21. `store_followers` - متابعو المتاجر
22. `conversations` - المحادثات
23. `messages` - الرسائل

### System Tables (2)
24. `device_tokens` - رموز FCM
25. `package_subscriptions` - اشتراكات الباقات

---

## 🔑 المفاتيح المهمة

### User Profile Chain:
```
user_profiles.id = auth.users.id
stores.owner_id = user_profiles.id
products.store_id = stores.id
```

### Shopping Chain:
```
user_profiles.id = carts.user_id
carts.id = cart_items.cart_id
cart_items.product_id = products.id
```

### Order Chain:
```
user_profiles.id = orders.customer_id
stores.id = orders.store_id
orders.id = order_items.order_id
```

---

## ⚠️ المشاكل المعروفة

1. **`products.stock` vs `stock_quantity`** - عدم توحيد
2. **`conversations.merchant_id`** - يشير إلى `stores` بدلاً من `user_profiles`
3. **RLS معطل** - يجب تفعيله في الإنتاج
4. **جداول مفقودة:** `wishlist`, `recently_viewed`, `product_variants`

---

## ✅ نقاط القوة

- ✅ بنية واضحة ومنظمة
- ✅ فهارس جيدة
- ✅ دعم JSONB
- ✅ نظام Snapshots
- ✅ دعم هرمي للفئات

---

**للمزيد من التفاصيل:** راجع `DATABASE_SCHEMA_ANALYSIS.md`

