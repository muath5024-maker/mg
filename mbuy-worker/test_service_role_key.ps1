# Test Service Role Key directly

Write-Host "Testing Service Role Key..." -ForegroundColor Cyan
Write-Host ""

# Get Service Role Key from user
Write-Host "Enter your Service Role Key:" -ForegroundColor Yellow
$serviceRoleKey = Read-Host ""

if ([string]::IsNullOrWhiteSpace($serviceRoleKey)) {
    Write-Host "No key provided" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Testing connection to Supabase..." -ForegroundColor Yellow

try {
    # Test query to mbuy_users table
    $headers = @{
        "apikey" = $serviceRoleKey
        "Authorization" = "Bearer $serviceRoleKey"
        "Content-Type" = "application/json"
    }

    $response = Invoke-RestMethod -Uri "https://sirqidofuvphqcxqchyc.supabase.co/rest/v1/mbuy_users?select=*&limit=1" `
        -Method Get `
        -Headers $headers `
        -ErrorAction Stop

    Write-Host "✅ Service Role Key is valid!" -ForegroundColor Green
    Write-Host "   Can access mbuy_users table" -ForegroundColor Gray
    Write-Host ""
    
    # Test insert
    Write-Host "Testing insert capability..." -ForegroundColor Yellow
    $testEmail = "test_$(Get-Random -Minimum 1000 -Maximum 9999)@test.com"
    $testData = @{
        email = $testEmail
        password_hash = "test_hash"
    } | ConvertTo-Json

    $insertResponse = Invoke-RestMethod -Uri "https://sirqidofuvphqcxqchyc.supabase.co/rest/v1/mbuy_users" `
        -Method Post `
        -Headers $headers `
        -Body $testData `
        -ErrorAction Stop

    Write-Host "✅ Can insert into mbuy_users table!" -ForegroundColor Green
    
    # Clean up test record
    if ($insertResponse.id) {
        Invoke-RestMethod -Uri "https://sirqidofuvphqcxqchyc.supabase.co/rest/v1/mbuy_users?id=eq.$($insertResponse.id)" `
            -Method Delete `
            -Headers $headers `
            -ErrorAction SilentlyContinue
        Write-Host "   Cleaned up test record" -ForegroundColor Gray
    }

} catch {
    Write-Host "❌ Service Role Key test failed!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "   Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Service Role Key is working correctly!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

