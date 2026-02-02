# ========================================
# إصلاح AnythingLLM - Setup Script
# ========================================

Write-Host "🔧 بدء إصلاح وإعداد AnythingLLM..." -ForegroundColor Cyan
Write-Host ""

# 1. التحقق من Ollama
Write-Host "1️⃣ التحقق من Ollama..." -ForegroundColor Yellow
$ollamaStatus = ollama list
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Ollama يعمل" -ForegroundColor Green
    Write-Host "   النماذج المتاحة:" -ForegroundColor Gray
    ollama list | Select-Object -First 5
} else {
    Write-Host "❌ Ollama لا يعمل - يرجى تشغيله" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 2. تحديث AnythingLLM
Write-Host "2️⃣ سحب آخر إصدار من AnythingLLM..." -ForegroundColor Yellow
docker pull mintplexlabs/anythingllm:latest

Write-Host ""

# 3. إعادة تشغيل بإعدادات محسنة
Write-Host "3️⃣ إعادة تشغيل AnythingLLM..." -ForegroundColor Yellow
Set-Location C:\mg\docker
docker rm -f anythingllm 2>$null
docker-compose up -d anythingllm

Write-Host ""
Write-Host "⏳ الانتظار 20 ثانية لبدء التشغيل..." -ForegroundColor Yellow
Start-Sleep -Seconds 20

# 4. التحقق من الحالة
Write-Host ""
Write-Host "4️⃣ التحقق من الحالة..." -ForegroundColor Yellow
$container = docker ps --filter "name=anythingllm" --format "{{.Status}}"
if ($container -like "*Up*") {
    Write-Host "✅ AnythingLLM يعمل بنجاح" -ForegroundColor Green
} else {
    Write-Host "❌ فشل تشغيل AnythingLLM" -ForegroundColor Red
    Write-Host "اللوجات:" -ForegroundColor Yellow
    docker logs anythingllm --tail 20
    exit 1
}

# 5. فحص الأخطاء
Write-Host ""
Write-Host "5️⃣ فحص الأخطاء..." -ForegroundColor Yellow
$errors = docker logs anythingllm --tail 50 | Select-String -Pattern "error|Error|ERROR" -CaseSensitive:$false
if ($errors.Count -eq 0) {
    Write-Host "✅ لا توجد أخطاء" -ForegroundColor Green
} else {
    Write-Host "⚠️ تم العثور على $($errors.Count) أخطاء:" -ForegroundColor Yellow
    $errors | Select-Object -First 5
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "✅ الإعداد اكتمل بنجاح!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""
Write-Host "📋 الخطوات التالية:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. افتح AnythingLLM في المتصفح:" -ForegroundColor White
Write-Host "   http://localhost:3001" -ForegroundColor Gray
Write-Host ""
Write-Host "2. إعداد LLM Provider:" -ForegroundColor White
Write-Host "   → Settings → LLM Preference" -ForegroundColor Gray
Write-Host "   → اختر: Ollama" -ForegroundColor Gray
Write-Host "   → Base URL: http://host.docker.internal:11434" -ForegroundColor Gray
Write-Host "   → Model: llama3.1:8b أو gemma3:1b" -ForegroundColor Gray
Write-Host ""
Write-Host "3. إعداد Embedding:" -ForegroundColor White
Write-Host "   → Settings → Embedding Preference" -ForegroundColor Gray
Write-Host "   → اختر: Ollama" -ForegroundColor Gray
Write-Host "   → Model: nomic-embed-text:latest" -ForegroundColor Gray
Write-Host ""
Write-Host "4. إنشاء Workspace:" -ForegroundColor White
Write-Host "   → New Workspace → اسمه: mbuy-project" -ForegroundColor Gray
Write-Host ""
Write-Host "5. رفع المستندات:" -ForegroundColor White
Write-Host "   → Upload Documents → From GitHub" -ForegroundColor Gray
Write-Host "   → https://github.com/muath5024-maker/mg" -ForegroundColor Gray
Write-Host "   → Branch: main" -ForegroundColor Gray
Write-Host ""
Write-Host "🌐 فتح المتصفح..." -ForegroundColor Yellow
Start-Process "http://localhost:3001"
Write-Host ""
Write-Host "✅ جاهز للاستخدام!" -ForegroundColor Green
Write-Host ""
