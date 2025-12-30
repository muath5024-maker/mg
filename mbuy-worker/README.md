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
| POST | `/auth/supabase/register` | Register new user |
| POST | `/auth/supabase/login` | Login user |
| POST | `/auth/supabase/logout` | Logout user |
| POST | `/auth/supabase/refresh` | Refresh token |
| GET | `/auth/profile` | Get user profile |

### Public Routes (`/public/*`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/public/products` | List products |
| GET | `/public/products/:id` | Get product |
| GET | `/public/stores` | List stores |
| GET | `/public/stores/:id` | Get store |
| GET | `/categories` | List categories |

### Merchant Routes (`/secure/merchant/*`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/secure/merchant/store` | Get merchant store |
| POST | `/secure/merchant/store` | Create store |
| PUT | `/secure/merchant/store` | Update store |
| GET | `/secure/merchant/products` | List merchant products |
| POST | `/secure/merchant/products` | Create product |
| PUT | `/secure/merchant/products/:id` | Update product |
| DELETE | `/secure/merchant/products/:id` | Delete product |

### Marketing Routes (`/secure/marketing/*`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/secure/marketing/coupons` | List coupons |
| POST | `/secure/marketing/coupons` | Create coupon |
| GET | `/secure/marketing/flash-sales` | List flash sales |
| POST | `/secure/marketing/flash-sales` | Create flash sale |
| GET | `/secure/marketing/abandoned-carts` | List abandoned carts |

### AI Routes (`/ai/*`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/ai/generate` | Generate content |
| POST | `/ai/studio/image` | Generate image |
| POST | `/ai/studio/video` | Generate video |
| POST | `/ai/jobs/description` | Generate product description |

### Analytics Routes (`/secure/analytics/*`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/secure/analytics/dashboard` | Dashboard overview |
| GET | `/secure/analytics/products` | Product analytics |
| GET | `/secure/analytics/insights` | Smart insights |

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
