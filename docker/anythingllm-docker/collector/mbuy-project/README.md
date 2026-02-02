# MBUY Project Overview

## Project Structure

### Frontend: Flutter App (mbuy/)
- Customer shopping application
- Merchant dashboard screens
- Clean Architecture with Riverpod

### Backend: Cloudflare Worker (mbuy-worker/)
- Hono framework API Gateway
- Custom JWT authentication
- PostgreSQL database (Supabase/Neon)
- GraphQL support

### Database: PostgreSQL
- Tables: users, stores, products, orders
- Development: localhost:5432
- Production: Neon.tech

### Storage
- Development: MinIO (localhost:9000)
- Production: Cloudflare R2

## Tech Stack
- Flutter 3.10+
- TypeScript 5.3+
- Hono 4.6+
- PostgreSQL 16
- Redis 7

## Key Features
- Multi-user types (customer, merchant, admin)
- Store management
- Product catalog
- Order processing
- Payment integration
- AI services (Ollama)

## Development Setup
1. Docker services: `docker-compose -f docker-compose.dev.yml up -d`
2. Worker: `cd mbuy-worker && npm run dev`
3. Flutter: `cd mbuy && flutter run`

## Authentication
- Custom JWT (not Supabase Auth)
- merchant@mbuy.dev / 123456
- customer@mbuy.dev / 123456
