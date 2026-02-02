# ============================================
# AnythingLLM + VS Code Setup Script
# ============================================

Write-Host "🚀 إعداد التكامل بين AnythingLLM و VS Code و GitHub..." -ForegroundColor Cyan

# 1. تشغيل AnythingLLM
Write-Host ""
Write-Host "1️⃣ تشغيل AnythingLLM..." -ForegroundColor Yellow
Set-Location docker
docker-compose up -d anythingllm

# 2. الانتظار حتى يصبح جاهزاً
Write-Host ""
Write-Host "⏳ انتظار AnythingLLM (30 ثانية)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# 3. فتح في المتصفح
Write-Host ""
Write-Host "3️⃣ فتح AnythingLLM في المتصفح..." -ForegroundColor Yellow
Start-Process "http://localhost:3001"

# 4. تعليمات الـ API Key
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "📝 خطوات مهمة:" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""
Write-Host "1. في AnythingLLM (http://localhost:3001):" -ForegroundColor White
Write-Host "   → Settings → API Keys" -ForegroundColor Gray
Write-Host "   → Create New API Key" -ForegroundColor Gray
Write-Host "   → انسخ الـ API Key" -ForegroundColor Gray
Write-Host ""
Write-Host "2. ضع API Key في:" -ForegroundColor White
Write-Host "   → docker/.env.dev (سطر ANYTHINGLLM_API_KEY)" -ForegroundColor Gray
Write-Host "   → .vscode/settings.json (سطر anything-llm.apiKey)" -ForegroundColor Gray
Write-Host ""
Write-Host "3. (اختياري) إضافة GitHub Token:" -ForegroundColor White
Write-Host "   → https://github.com/settings/tokens" -ForegroundColor Gray
Write-Host "   → Generate new token (classic)" -ForegroundColor Gray
Write-Host "   → اختر: repo, read:org, workflow" -ForegroundColor Gray
Write-Host "   → ضعه في: docker/.env.dev (سطر GITHUB_TOKEN)" -ForegroundColor Gray
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "✅ التكامل جاهز!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 الروابط:" -ForegroundColor Cyan
Write-Host "   AnythingLLM: http://localhost:3001" -ForegroundColor White
Write-Host "   n8n: http://localhost:5678" -ForegroundColor White
Write-Host "   GitHub: https://github.com/muath5024-maker/mg" -ForegroundColor White
Write-Host ""
Write-Host "📖 للمزيد: راجع VSCODE_ANYTHINGLLM_SETUP.md" -ForegroundColor Yellow
Write-Host ""

# العودة للمجلد الأصلي
Set-Location ..
