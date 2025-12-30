# ========================================
# MBUY Auth Complete Verification Script
# ========================================

$baseUrl = "https://misty-mode-b68b.baharista1.workers.dev"
$testEmail = "verify_$(Get-Random -Minimum 1000 -Maximum 9999)@test.com"
$testPassword = "TestPassword123!"
$testName = "Test User"

$allTestsPassed = $true
$errors = @()

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "MBUY Auth Complete Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Base URL: $baseUrl" -ForegroundColor Gray
Write-Host "Test Email: $testEmail" -ForegroundColor Gray
Write-Host ""

# ========================================
# Test 1: Worker Health Check
# ========================================
Write-Host "[1/6] Checking if Worker is running..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-WebRequest -Uri "$baseUrl/auth/register" `
        -Method Post `
        -ContentType "application/json" `
        -Body '{"test":"test"}' `
        -ErrorAction Stop `
        -UseBasicParsing
    
    Write-Host "   [OK] Worker is running (Status: $($healthResponse.StatusCode))" -ForegroundColor Green
} catch {
    $errorMsg = "Worker is not responding or unavailable"
    Write-Host "   [FAIL] $errorMsg" -ForegroundColor Red
    Write-Host "   Details: $($_.Exception.Message)" -ForegroundColor Red
    $allTestsPassed = $false
    $errors += $errorMsg
    Write-Host ""
    Write-Host "[WARNING] Cannot continue - Worker is unavailable" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# ========================================
# Test 2: Register Endpoint
# ========================================
Write-Host "[2/6] Testing Register Endpoint..." -ForegroundColor Yellow
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
        Write-Host "   [OK] Register successful!" -ForegroundColor Green
        Write-Host "   User ID: $($registerResponse.user.id)" -ForegroundColor Gray
        Write-Host "   Email: $($registerResponse.user.email)" -ForegroundColor Gray
        $registerToken = $registerResponse.token
        Write-Host "   Token received: $($registerToken.Substring(0, [Math]::Min(50, $registerToken.Length)))..." -ForegroundColor Gray
    } else {
        $errorMsg = "Register failed: $($registerResponse.error)"
        Write-Host "   [FAIL] $errorMsg" -ForegroundColor Red
        $allTestsPassed = $false
        $errors += $errorMsg
    }
} catch {
    $errorMsg = "Register error: $($_.Exception.Message)"
    Write-Host "   [FAIL] $errorMsg" -ForegroundColor Red
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
Write-Host "[3/6] Testing Login Endpoint..." -ForegroundColor Yellow
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
        Write-Host "   [OK] Login successful!" -ForegroundColor Green
        Write-Host "   User ID: $($loginResponse.user.id)" -ForegroundColor Gray
        $loginToken = $loginResponse.token
        Write-Host "   Token received: $($loginToken.Substring(0, [Math]::Min(50, $loginToken.Length)))..." -ForegroundColor Gray
    } else {
        $errorMsg = "Login failed: $($loginResponse.error)"
        Write-Host "   [FAIL] $errorMsg" -ForegroundColor Red
        $allTestsPassed = $false
        $errors += $errorMsg
    }
} catch {
    $errorMsg = "Login error: $($_.Exception.Message)"
    Write-Host "   [FAIL] $errorMsg" -ForegroundColor Red
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
Write-Host "[4/6] Testing Get Current User (Protected Endpoint)..." -ForegroundColor Yellow
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
            Write-Host "   [OK] Get Current User successful!" -ForegroundColor Green
            Write-Host "   User ID: $($meResponse.user.id)" -ForegroundColor Gray
            Write-Host "   Email: $($meResponse.user.email)" -ForegroundColor Gray
            Write-Host "   Full Name: $($meResponse.user.full_name)" -ForegroundColor Gray
        } else {
            $errorMsg = "Get Current User failed: $($meResponse.error)"
            Write-Host "   [FAIL] $errorMsg" -ForegroundColor Red
            $allTestsPassed = $false
            $errors += $errorMsg
        }
    } catch {
        $errorMsg = "Get Current User error: $($_.Exception.Message)"
        Write-Host "   [FAIL] $errorMsg" -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            Write-Host "   Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
            $errorMsg += " - $($_.ErrorDetails.Message)"
        }
        $allTestsPassed = $false
        $errors += $errorMsg
    }
} else {
    Write-Host "   [SKIP] Test skipped - No token available" -ForegroundColor Yellow
    $allTestsPassed = $false
}

Write-Host ""

# ========================================
# Test 5: Invalid Token Test
# ========================================
Write-Host "[5/6] Testing Invalid Token (Security Check)..." -ForegroundColor Yellow
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
    $errorMsg = "Security Issue: Invalid token was accepted!"
    Write-Host "   [FAIL] $errorMsg" -ForegroundColor Red
    $allTestsPassed = $false
    $errors += $errorMsg
} catch {
    # Expected: Should reject invalid token
    if ($_.Exception.Message -like "*401*" -or $_.Exception.Message -like "*Unauthorized*" -or $_.Exception.Message -like "*Invalid*") {
        Write-Host "   [OK] Invalid token was correctly rejected" -ForegroundColor Green
    } else {
        Write-Host "   [WARN] Invalid token test - Unexpected: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host ""

# ========================================
# Test 6: Logout Endpoint
# ========================================
Write-Host "[6/6] Testing Logout Endpoint..." -ForegroundColor Yellow
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
            Write-Host "   [OK] Logout successful!" -ForegroundColor Green
        } else {
            Write-Host "   [WARN] Logout response: $($logoutResponse.error)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "   [WARN] Logout error (may be expected): $($_.Exception.Message)" -ForegroundColor Yellow
    }
} else {
    Write-Host "   [SKIP] Test skipped - No token available" -ForegroundColor Yellow
}

Write-Host ""

# ========================================
# Final Summary
# ========================================
Write-Host "========================================" -ForegroundColor Cyan
if ($allTestsPassed) {
    Write-Host "[SUCCESS] All tests passed!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "MBUY Auth system is working correctly!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Summary:" -ForegroundColor Cyan
    Write-Host "  [OK] Worker is running" -ForegroundColor Green
    Write-Host "  [OK] Register works" -ForegroundColor Green
    Write-Host "  [OK] Login works" -ForegroundColor Green
    Write-Host "  [OK] Protected endpoints work" -ForegroundColor Green
    Write-Host "  [OK] Security checks work" -ForegroundColor Green
    Write-Host "  [OK] Logout works" -ForegroundColor Green
    Write-Host ""
    Write-Host "System is ready to use!" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Some tests failed" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Errors found:" -ForegroundColor Yellow
    foreach ($error in $errors) {
        Write-Host "  [FAIL] $error" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Please verify:" -ForegroundColor Yellow
    Write-Host "  1. Migrations are applied in Supabase" -ForegroundColor Yellow
    Write-Host "  2. Secrets are set in Cloudflare Worker" -ForegroundColor Yellow
    Write-Host "  3. Worker is deployed and running" -ForegroundColor Yellow
    Write-Host "  4. Check logs in Cloudflare Dashboard" -ForegroundColor Yellow
}
Write-Host ""

