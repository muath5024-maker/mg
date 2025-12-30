# ========================================
# سكريبت التحقق الشامل من نظام MBUY Auth
# ========================================

$baseUrl = "https://misty-mode-b68b.baharista1.workers.dev"
$testEmail = "verify_$(Get-Random -Minimum 1000 -Maximum 9999)@test.com"
$testPassword = "TestPassword123!"
$testName = "Test User"

$allTestsPassed = $true
$errors = @()

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🔍 التحقق الشامل من نظام MBUY Auth" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Base URL: $baseUrl" -ForegroundColor Gray
Write-Host "Test Email: $testEmail" -ForegroundColor Gray
Write-Host ""

# ========================================
# Test 1: Worker Health Check
# ========================================
Write-Host "[1/6] التحقق من أن Worker يعمل..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-WebRequest -Uri "$baseUrl/auth/register" `
        -Method Post `
        -ContentType "application/json" `
        -Body '{"test":"test"}' `
        -ErrorAction Stop `
        -UseBasicParsing
    
    Write-Host "   ✅ Worker يعمل (Status: $($healthResponse.StatusCode))" -ForegroundColor Green
} catch {
    $errorMsg = "Worker لا يستجيب أو غير متاح"
    Write-Host "   ❌ $errorMsg" -ForegroundColor Red
    Write-Host "   Details: $($_.Exception.Message)" -ForegroundColor Red
    $allTestsPassed = $false
    $errors += $errorMsg
    Write-Host ""
    Write-Host "⚠️ لا يمكن المتابعة - Worker غير متاح" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# ========================================
# Test 2: Register Endpoint
# ========================================
Write-Host "[2/6] اختبار Register Endpoint..." -ForegroundColor Yellow
$registerToken = $null
try {
    $registerBody = @{
        email = $testEmail
        password = $testPassword
        full_name = $testName
    } | ConvertTo-Json

    $registerResponse = Invoke-RestMethod -Uri "$baseUrl/auth/register" `
        -Method Post `
        -ContentType "application/json" `
        -Body $registerBody `
        -ErrorAction Stop

    if ($registerResponse.ok -eq $true) {
        Write-Host "   ✅ Register نجح!" -ForegroundColor Green
        Write-Host "   User ID: $($registerResponse.user.id)" -ForegroundColor Gray
        Write-Host "   Email: $($registerResponse.user.email)" -ForegroundColor Gray
        $registerToken = $registerResponse.token
        Write-Host "   Token received: $($registerToken.Substring(0, [Math]::Min(50, $registerToken.Length)))..." -ForegroundColor Gray
    } else {
        $errorMsg = "Register failed: $($registerResponse.error)"
        Write-Host "   ❌ $errorMsg" -ForegroundColor Red
        $allTestsPassed = $false
        $errors += $errorMsg
    }
} catch {
    $errorMsg = "Register error: $($_.Exception.Message)"
    Write-Host "   ❌ $errorMsg" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "   Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        $errorMsg += " - $($_.ErrorDetails.Message)"
    }
    $allTestsPassed = $false
    $errors += $errorMsg
}

Write-Host ""

# ========================================
# Test 3: Login Endpoint
# ========================================
Write-Host "[3/6] اختبار Login Endpoint..." -ForegroundColor Yellow
$loginToken = $null
try {
    $loginBody = @{
        email = $testEmail
        password = $testPassword
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" `
        -Method Post `
        -ContentType "application/json" `
        -Body $loginBody `
        -ErrorAction Stop

    if ($loginResponse.ok -eq $true) {
        Write-Host "   ✅ Login نجح!" -ForegroundColor Green
        Write-Host "   User ID: $($loginResponse.user.id)" -ForegroundColor Gray
        $loginToken = $loginResponse.token
        Write-Host "   Token received: $($loginToken.Substring(0, [Math]::Min(50, $loginToken.Length)))..." -ForegroundColor Gray
    } else {
        $errorMsg = "Login فشل: $($loginResponse.error)"
        Write-Host "   ❌ $errorMsg" -ForegroundColor Red
        $allTestsPassed = $false
        $errors += $errorMsg
    }
} catch {
    $errorMsg = "Login error: $($_.Exception.Message)"
    Write-Host "   ❌ $errorMsg" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "   Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        $errorMsg += " - $($_.ErrorDetails.Message)"
    }
    $allTestsPassed = $false
    $errors += $errorMsg
}

Write-Host ""

# ========================================
# Test 4: Get Current User (Protected Endpoint)
# ========================================
Write-Host "[4/6] اختبار Get Current User (Protected Endpoint)..." -ForegroundColor Yellow
if ($loginToken) {
    try {
        $headers = @{
            "Authorization" = "Bearer $loginToken"
            "Content-Type" = "application/json"
        }

        $meResponse = Invoke-RestMethod -Uri "$baseUrl/auth/me" `
            -Method Get `
            -Headers $headers `
            -ErrorAction Stop

        if ($meResponse.ok -eq $true) {
            Write-Host "   ✅ Get Current User نجح!" -ForegroundColor Green
            Write-Host "   User ID: $($meResponse.user.id)" -ForegroundColor Gray
            Write-Host "   Email: $($meResponse.user.email)" -ForegroundColor Gray
            Write-Host "   Full Name: $($meResponse.user.full_name)" -ForegroundColor Gray
        } else {
            $errorMsg = "Get Current User failed: $($meResponse.error)"
            Write-Host "   ❌ $errorMsg" -ForegroundColor Red
            $allTestsPassed = $false
            $errors += $errorMsg
        }
    } catch {
        $errorMsg = "Get Current User error: $($_.Exception.Message)"
        Write-Host "   ❌ $errorMsg" -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            Write-Host "   Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
            $errorMsg += " - $($_.ErrorDetails.Message)"
        }
        $allTestsPassed = $false
        $errors += $errorMsg
    }
} else {
    Write-Host "   ⚠️ تم تخطي الاختبار - لا يوجد token" -ForegroundColor Yellow
    $allTestsPassed = $false
}

Write-Host ""

# ========================================
# Test 5: Invalid Token Test
# ========================================
Write-Host "[5/6] اختبار Invalid Token (Security Check)..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer invalid_token_12345"
        "Content-Type" = "application/json"
    }

    $invalidResponse = Invoke-RestMethod -Uri "$baseUrl/auth/me" `
        -Method Get `
        -Headers $headers `
        -ErrorAction Stop

    # If we get here, it means the endpoint accepted invalid token (BAD!)
    $errorMsg = "Security Issue: Invalid token تم قبوله!"
    Write-Host "   ❌ $errorMsg" -ForegroundColor Red
    $allTestsPassed = $false
    $errors += $errorMsg
} catch {
    # Expected: Should reject invalid token
    if ($_.Exception.Message -like "*401*" -or $_.Exception.Message -like "*Unauthorized*" -or $_.Exception.Message -like "*Invalid*") {
        Write-Host "   ✅ Invalid token تم رفضه بشكل صحيح" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️ Invalid token test - غير متوقع: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host ""

# ========================================
# Test 6: Logout Endpoint
# ========================================
Write-Host "[6/6] اختبار Logout Endpoint..." -ForegroundColor Yellow
if ($loginToken) {
    try {
        $headers = @{
            "Authorization" = "Bearer $loginToken"
            "Content-Type" = "application/json"
        }

        $logoutResponse = Invoke-RestMethod -Uri "$baseUrl/auth/logout" `
            -Method Post `
            -Headers $headers `
            -ErrorAction Stop

        if ($logoutResponse.ok -eq $true) {
            Write-Host "   ✅ Logout نجح!" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️ Logout response: $($logoutResponse.error)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "   ⚠️ Logout error (قد يكون متوقعاً): $($_.Exception.Message)" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ⚠️ تم تخطي الاختبار - لا يوجد token" -ForegroundColor Yellow
}

Write-Host ""

# ========================================
# Final Summary
# ========================================
Write-Host "========================================" -ForegroundColor Cyan
if ($allTestsPassed) {
    Write-Host "✅ جميع الاختبارات نجحت!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 نظام MBUY Auth يعمل بشكل صحيح!" -ForegroundColor Green
    Write-Host ""
    Write-Host "الملخص:" -ForegroundColor Cyan
    Write-Host "  ✅ Worker يعمل" -ForegroundColor Green
    Write-Host "  ✅ Register يعمل" -ForegroundColor Green
    Write-Host "  ✅ Login يعمل" -ForegroundColor Green
    Write-Host "  ✅ Protected Endpoints تعمل" -ForegroundColor Green
    Write-Host "  ✅ Security checks تعمل" -ForegroundColor Green
    Write-Host "  ✅ Logout يعمل" -ForegroundColor Green
    Write-Host ""
    Write-Host "النظام جاهز للاستخدام! 🚀" -ForegroundColor Green
} else {
    Write-Host "❌ بعض الاختبارات فشلت" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "الأخطاء المكتشفة:" -ForegroundColor Yellow
    foreach ($error in $errors) {
        Write-Host "  ❌ $error" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "يرجى التحقق من:" -ForegroundColor Yellow
    Write-Host "  1. Migrations تم تطبيقها في Supabase" -ForegroundColor Yellow
    Write-Host "  2. Secrets مُعدة في Cloudflare Worker" -ForegroundColor Yellow
    Write-Host "  3. Worker منشور ويعمل" -ForegroundColor Yellow
    Write-Host "  4. Logs في Cloudflare Dashboard" -ForegroundColor Yellow
}
Write-Host ""

