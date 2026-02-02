#!/bin/bash

# ============================================
# AnythingLLM + VS Code Setup Script
# ============================================

echo "🚀 إعداد التكامل بين AnythingLLM و VS Code و GitHub..."

# 1. تشغيل AnythingLLM
echo ""
echo "1️⃣ تشغيل AnythingLLM..."
cd docker
docker-compose up -d anythingllm

# 2. الانتظار حتى يصبح جاهزاً
echo ""
echo "⏳ انتظار AnythingLLM (30 ثانية)..."
sleep 30

# 3. فتح في المتصفح
echo ""
echo "3️⃣ فتح AnythingLLM في المتصفح..."
start http://localhost:3001

# 4. تعليمات الـ API Key
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 خطوات مهمة:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. في AnythingLLM (http://localhost:3001):"
echo "   → Settings → API Keys"
echo "   → Create New API Key"
echo "   → انسخ الـ API Key"
echo ""
echo "2. ضع API Key في:"
echo "   → docker/.env.dev (سطر ANYTHINGLLM_API_KEY)"
echo "   → .vscode/settings.json (سطر anything-llm.apiKey)"
echo ""
echo "3. (اختياري) إضافة GitHub Token:"
echo "   → https://github.com/settings/tokens"
echo "   → Generate new token (classic)"
echo "   → اختر: repo, read:org, workflow"
echo "   → ضعه في: docker/.env.dev (سطر GITHUB_TOKEN)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ التكامل جاهز!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔗 الروابط:"
echo "   AnythingLLM: http://localhost:3001"
echo "   n8n: http://localhost:5678"
echo "   GitHub: https://github.com/muath5024-maker/mg"
echo ""
echo "📖 للمزيد: راجع VSCODE_ANYTHINGLLM_SETUP.md"
echo ""
