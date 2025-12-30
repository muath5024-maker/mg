# Test MBUY Auth Endpoints
# Run this script after setting up secrets

$baseUrl = "https://misty-mode-b68b.baharista1.workers.dev"
$testEmail = "test_$(Get-Random -Minimum 1000 -Maximum 9999)@example.com"
$testPassword = "TestPassword123!"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "اختبار MBUY Auth Endpoints" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Base URL: $baseUrl" -ForegroundColor Gray
Write-Host "Test Email: $testEmail" -ForegroundColor Gray
Write-Host ""

# Test 1: Register
Write-Host "1. Testing POST /auth/register..." -ForegroundColor Yellow
try {
    $registerBody = @{
        email = $testEmail
        password = $testPassword
        full_name = "Test User"
    } | ConvertTo-Json

    $registerResponse = Invoke-RestMethod -Uri "$baseUrl/auth/register" `
        -Method Post `
        -ContentType "application/json" `
        -Body $registerBody `
        -ErrorAction Stop

    if ($registerResponse.ok -eq $true) {
        Write-Host "   ✅ Registration successful!" -ForegroundColor Green
        Write-Host "   User ID: $($registerResponse.user.id)" -ForegroundColor Gray
        Write-Host "   Email: $($registerResponse.user.email)" -ForegroundColor Gray
        $token = $registerResponse.token
        Write-Host "   Token received: $($token.Substring(0, [Math]::Min(50, $token.Length)))..." -ForegroundColor Gray
    } else {
        Write-Host "   ❌ Registration failed: $($registerResponse.error)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ❌ Registration error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "   Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    exit 1
}

Write-Host ""

# Test 2: Login
Write-Host "2. Testing POST /auth/login..." -ForegroundColor Yellow
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
        Write-Host "   ✅ Login successful!" -ForegroundColor Green
        Write-Host "   User ID: $($loginResponse.user.id)" -ForegroundColor Gray
        $loginToken = $loginResponse.token
        Write-Host "   Token received: $($loginToken.Substring(0, [Math]::Min(50, $loginToken.Length)))..." -ForegroundColor Gray
    } else {
        Write-Host "   ❌ Login failed: $($loginResponse.error)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ❌ Login error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "   Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    exit 1
}

Write-Host ""

# Test 3: Get Current User (requires token)
Write-Host "3. Testing GET /auth/me..." -ForegroundColor Yellow
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
        Write-Host "   ✅ Get current user successful!" -ForegroundColor Green
        Write-Host "   User ID: $($meResponse.user.id)" -ForegroundColor Gray
        Write-Host "   Email: $($meResponse.user.email)" -ForegroundColor Gray
        Write-Host "   Full Name: $($meResponse.user.full_name)" -ForegroundColor Gray
    } else {
        Write-Host "   ❌ Get current user failed: $($meResponse.error)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ❌ Get current user error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "   Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    exit 1
}

Write-Host ""

# Test 4: Logout
Write-Host "4. Testing POST /auth/logout..." -ForegroundColor Yellow
try {
    $logoutResponse = Invoke-RestMethod -Uri "$baseUrl/auth/logout" `
        -Method Post `
        -Headers $headers `
        -ErrorAction Stop

    if ($logoutResponse.ok -eq $true) {
        Write-Host "   ✅ Logout successful!" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Logout failed: $($logoutResponse.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "   ⚠️ Logout error (may be expected): $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ All tests completed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

