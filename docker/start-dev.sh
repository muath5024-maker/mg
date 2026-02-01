#!/bin/bash

# ============================================
# MBUY Development Environment - Start Script
# ============================================

echo "🚀 Starting MBUY Development Environment..."

# التحقق من وجود Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# التحقق من وجود Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# الانتقال لمجلد docker
cd "$(dirname "$0")"

echo "📦 Starting Docker Compose services..."
docker-compose -f docker-compose.dev.yml up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

echo ""
echo "✅ MBUY Development Environment is ready!"
echo ""
echo "📊 Service URLs:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🔌 Worker API:     http://localhost:8787"
echo "  💾 Adminer:        http://localhost:8080"
echo "  📦 MinIO Console:  http://localhost:9001"
echo "  🤖 AnythingLLM:    http://localhost:3001"
echo "  ⚡ n8n:            http://localhost:5678"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Database Connection:"
echo "  Host: localhost"
echo "  Port: 5432"
echo "  User: postgres"
echo "  Pass: postgres123"
echo "  DB:   mbuy_dev"
echo ""
echo "🔍 To view logs: docker-compose -f docker-compose.dev.yml logs -f"
echo "🛑 To stop:      docker-compose -f docker-compose.dev.yml down"
echo ""
