# 🚀 MBUY API Gateway - Cloudflare Worker

<div align="center">

**Backend API Gateway للتطبيق MBUY**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![Hono](https://img.shields.io/badge/Hono-4.6+-E36002?style=for-the-badge)](https://hono.dev)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-F38020?style=for-the-badge&logo=cloudflare)](https://workers.cloudflare.com)

</div>

---

## 📋 فهرس المحتويات

- [نظرة عامة](#-نظرة-عامة)
- [البنية](#-البنية)
- [التثبيت](#-التثبيت)
- [التطوير](#-التطوير)
- [API Endpoints](#-api-endpoints)
- [Middleware](#-middleware)
- [النشر](#-النشر)

---

## 🎯 نظرة عامة

هذا الـ Worker يعمل كـ API Gateway لتطبيق MBUY، يتعامل مع:
- 🔐 المصادقة وإدارة الجلسات
- 📦 إدارة المنتجات والمخزون
- 🛒 معالجة الطلبات
- 📊 التحليلات والتقارير
- 🤖 خدمات AI
- 📁 رفع وتقديم الوسائط

---

## 🏗️ البنية

```
src/
├── index.ts                    # Entry Point & Main Router
├── types.ts                    # TypeScript Definitions
│
├── routes/                     # Route Modules (Modular Architecture)
│   ├── public.ts               # Public routes (no auth)
│   ├── auth.ts                 # Authentication routes
│   ├── merchant.ts             # Merchant dashboard routes
│   ├── marketing.ts            # Marketing & promotions
│   ├── ai.ts                   # AI generation routes
│   ├── analytics.ts            # Analytics & reporting
│   ├── customer.ts             # Customer management
│   ├── inventory.ts            # Stock management
│   ├── subscriptions.ts        # Plans & subscriptions
│   └── ...                     # Feature-specific routes
│
├── endpoints/                  # Business Logic Handlers
│   ├── supabaseAuth.ts         # Auth handlers
│   ├── store.ts                # Store management
│   ├── products.ts             # Product CRUD
│   ├── coupons.ts              # Coupon management
│   └── ...                     # More handlers
│
├── middleware/                 # Request Middleware
│   ├── supabaseAuthMiddleware.ts
│   ├── rateLimiter.ts
│   ├── requestLogger.ts
│   ├── errorHandler.ts
│   └── validation.ts
│
├── utils/                      # Utilities
│   ├── supabase.ts             # Supabase client
│   └── logging.ts              # Logging utilities
│
├── durable-objects/            # Stateful Objects
│   ├── SessionStore.ts
│   └── ChatRoom.ts
│
├── queues/                     # Background Jobs
│   └── orderQueue.ts
│
└── workflows/                  # Complex Operations
```

---

## 🚀 التثبيت

```bash
# Clone the repository
git clone https://github.com/your-repo/mbuy-worker.git
cd mbuy-worker

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your values

# Setup Cloudflare secrets
npm run setup-secrets
```

---

## 💻 التطوير

### التشغيل محلياً

```bash
# Development mode
npm run dev

# Development with logs
npm run dev:logs
```

### الاختبارات

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

---

## 📚 API Endpoints

### Authentication (`/auth/*`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/login` | تسجيل الدخول |
| POST | `/auth/register` | إنشاء حساب جديد |
| POST | `/auth/refresh` | تجديد التوكن |
| POST | `/auth/logout` | تسجيل الخروج |
| GET | `/auth/me` | بيانات المستخدم الحالي |
| POST | `/auth/forgot-password` | استعادة كلمة المرور |

### Public Routes (`/api/public/*`) - بدون مصادقة

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/public/products` | قائمة المنتجات |
| GET | `/api/public/products/:id` | تفاصيل منتج |
| GET | `/api/public/products/trending` | المنتجات الرائجة |
| GET | `/api/public/products/flash-deals` | عروض فلاش |
| GET | `/api/public/stores` | قائمة المتاجر |
| GET | `/api/public/stores/featured` | المتاجر المميزة |
| GET | `/api/public/categories/all` | جميع الأقسام |
| GET | `/api/public/platform-categories` | أقسام المنصة |
| GET | `/api/public/boosted-products` | المنتجات المعززة |
| GET | `/api/public/search/products` | بحث المنتجات |
| GET | `/api/public/search/stores` | بحث المتاجر |
| GET | `/api/public/search/suggestions` | اقتراحات البحث |

### Customer Routes (`/api/customer/*`) - تتطلب مصادقة

#### السلة (Cart)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/customer/cart` | جلب السلة |
| POST | `/api/customer/cart` | إضافة للسلة |
| PUT | `/api/customer/cart/:itemId` | تحديث الكمية |
| DELETE | `/api/customer/cart/:itemId` | حذف عنصر |
| DELETE | `/api/customer/cart` | تفريغ السلة |
| GET | `/api/customer/cart/count` | عدد العناصر |

#### المفضلة (Favorites)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/customer/favorites` | جلب المفضلة |
| POST | `/api/customer/favorites` | إضافة للمفضلة |
| DELETE | `/api/customer/favorites/:productId` | حذف من المفضلة |
| GET | `/api/customer/favorites/check/:productId` | تحقق من المفضلة |
| POST | `/api/customer/favorites/toggle` | تبديل المفضلة |
| GET | `/api/customer/favorites/count` | عدد المفضلة |
| DELETE | `/api/customer/favorites` | تفريغ المفضلة |

#### الدفع والطلبات (Checkout & Orders)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/customer/checkout/validate` | التحقق قبل الدفع |
| POST | `/api/customer/checkout` | إنشاء طلب |
| GET | `/api/customer/checkout/orders` | طلباتي |
| GET | `/api/customer/checkout/orders/:id` | تفاصيل طلب |
| POST | `/api/customer/checkout/orders/:id/cancel` | إلغاء طلب |

#### العناوين (Addresses)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/customer/addresses` | جلب العناوين |
| POST | `/api/customer/addresses` | إضافة عنوان |
| PUT | `/api/customer/addresses/:id` | تحديث عنوان |
| DELETE | `/api/customer/addresses/:id` | حذف عنوان |
| PUT | `/api/customer/addresses/:id/default` | تعيين افتراضي |

### Merchant Routes (`/api/merchant/*`) - تتطلب صلاحية تاجر

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/merchant/products` | قائمة منتجات التاجر |
| GET | `/api/merchant/products/:id` | تفاصيل منتج |
| POST | `/api/merchant/products` | إنشاء منتج |
| PUT | `/api/merchant/products/:id` | تحديث منتج |
| DELETE | `/api/merchant/products/:id` | حذف منتج |
| GET | `/api/merchant/orders` | طلبات التاجر |
| GET | `/api/merchant/orders/:id` | تفاصيل طلب |
| PUT | `/api/merchant/orders/:id/status` | تحديث حالة الطلب |
| GET | `/api/merchant/categories` | أقسام التاجر |
| POST | `/api/merchant/categories` | إنشاء قسم |
| PUT | `/api/merchant/categories/:id` | تحديث قسم |
| DELETE | `/api/merchant/categories/:id` | حذف قسم |
| GET | `/api/merchant/inventory` | المخزون |
| PUT | `/api/merchant/inventory/:productId` | تحديث المخزون |

### Admin Routes (`/api/admin/*`) - تتطلب صلاحية إدارية

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/dashboard/stats` | إحصائيات لوحة التحكم |
| GET | `/api/admin/dashboard/revenue` | تقرير الإيرادات |
| GET | `/api/admin/merchants` | قائمة التجار |
| GET | `/api/admin/merchants/:id` | تفاصيل تاجر |
| PUT | `/api/admin/merchants/:id` | تحديث تاجر |
| GET | `/api/admin/customers` | قائمة العملاء |
| GET | `/api/admin/customers/:id` | تفاصيل عميل |
| GET | `/api/admin/orders` | جميع الطلبات |
| GET | `/api/admin/products` | جميع المنتجات |

### AI Routes (`/ai/*`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/ai/generate` | توليد محتوى |
| POST | `/ai/studio/image` | توليد صورة |
| POST | `/ai/jobs/description` | توليد وصف منتج |

---

## 🔒 Middleware

### Authentication Middleware
```typescript
// Verifies JWT token and sets user context
app.use('/secure/*', supabaseAuthMiddleware);
```

### Rate Limiter
```typescript
// Limits requests per IP
app.use('*', defaultRateLimiter);
app.use('/auth/*', authRateLimiter); // Stricter for auth
```

### Error Handler
```typescript
// Global error handling
app.use('*', errorHandler);
```

### Request Logger
```typescript
// Logs all requests
app.use('*', requestLogger);
```

---

## 🌐 النشر

### Cloudflare Workers

```bash
# Deploy to Cloudflare
npm run deploy

# View logs
wrangler tail
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `EDGE_INTERNAL_KEY` | Internal API key |
| `CF_IMAGES_ACCOUNT_ID` | Cloudflare Images account |
| `CF_IMAGES_API_TOKEN` | Cloudflare Images token |
| `CF_STREAM_ACCOUNT_ID` | Cloudflare Stream account |
| `CF_STREAM_API_TOKEN` | Cloudflare Stream token |
| `R2_PUBLIC_URL` | R2 bucket public URL |

### Wrangler Configuration

```jsonc
// wrangler.jsonc
{
  "name": "mbuy-worker",
  "main": "src/index.ts",
  "compatibility_date": "2024-01-01",
  "ai": {
    "binding": "AI"
  },
  "r2_buckets": [
    { "binding": "R2", "bucket_name": "mbuy-media" }
  ]
}
```

---

## 📊 Monitoring

### Health Check
```bash
curl https://your-worker.workers.dev/
# Response: { "ok": true, "message": "MBUY API Gateway", "version": "1.0.0" }
```

### Test Endpoints
```bash
# Test AI
curl https://your-worker.workers.dev/test-ai

# Test R2
curl https://your-worker.workers.dev/test-r2

# Test Supabase
curl https://your-worker.workers.dev/test-supabase
```

---

## 🤝 المساهمة

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 الرخصة

MIT License

---

<div align="center">

**MBUY Worker** - Powered by Cloudflare Workers

© 2025 MBUY

</div>
