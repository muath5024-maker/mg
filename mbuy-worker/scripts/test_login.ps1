# Script to test login endpoint
# Usage: .\test_login.ps1 -Email "user@example.com" -Password "password123"

param(
    [Parameter(Mandatory=$true)]
    [string]$Email,
    
    [Parameter(Mandatory=$true)]
    [string]$Password
)

$ErrorActionPreference = "Stop"

Write-Host "Testing login..." -ForegroundColor Cyan
Write-Host "Email: $Email" -ForegroundColor Yellow

# Get Worker URL from environment or use default
$workerUrl = $env:WORKER_URL
if (-not $workerUrl) {
    $workerUrl = "https://misty-mode-b68b.baharista1.workers.dev"
}

Write-Host "Worker URL: $workerUrl" -ForegroundColor Yellow

# Test login
$body = @{
    email = $Email
    password = $Password
} | ConvertTo-Json

try {
    Write-Host "`nSending login request..." -ForegroundColor Cyan
    
    $response = Invoke-RestMethod -Uri "$workerUrl/auth/login" `
        -Method Post `
        -Body $body `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    if ($response.ok) {
        Write-Host "`n✅ Login successful!" -ForegroundColor Green
        Write-Host "User ID: $($response.user.id)" -ForegroundColor Green
        Write-Host "Email: $($response.user.email)" -ForegroundColor Green
        Write-Host "Full Name: $($response.user.full_name)" -ForegroundColor Green
        Write-Host "Token: $($response.token.Substring(0, 50))..." -ForegroundColor Gray
    } else {
        Write-Host "`n❌ Login failed" -ForegroundColor Red
        Write-Host "Error: $($response.error)" -ForegroundColor Red
        Write-Host "Message: $($response.message)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "`n❌ Error occurred:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        try {
            $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
            Write-Host "Error Code: $($errorDetails.code)" -ForegroundColor Red
            Write-Host "Error Message: $($errorDetails.message)" -ForegroundColor Red
            
            if ($errorDetails.code -eq "INVALID_CREDENTIALS") {
                Write-Host "`n⚠️ Invalid credentials. Possible reasons:" -ForegroundColor Yellow
                Write-Host "  1. User doesn't exist in mbuy_users table" -ForegroundColor Yellow
                Write-Host "  2. Password is incorrect" -ForegroundColor Yellow
                Write-Host "  3. User was created with different password hash method" -ForegroundColor Yellow
                Write-Host "`n💡 Try creating the user first using: .\create_mbuy_user.ps1" -ForegroundColor Cyan
            }
        } catch {
            Write-Host "Raw error: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
    }
    
    exit 1
}

Write-Host "`n✅ Done!" -ForegroundColor Green

