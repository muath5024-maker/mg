# Script to create a user in mbuy_users table
# Usage: .\create_mbuy_user.ps1 -Email "user@example.com" -Password "password123"

param(
    [Parameter(Mandatory=$true)]
    [string]$Email,
    
    [Parameter(Mandatory=$true)]
    [string]$Password
)

$ErrorActionPreference = "Stop"

Write-Host "Creating MBUY user..." -ForegroundColor Cyan
Write-Host "Email: $Email" -ForegroundColor Yellow

# Get Worker URL from environment or use default
$workerUrl = $env:WORKER_URL
if (-not $workerUrl) {
    $workerUrl = "https://misty-mode-b68b.baharista1.workers.dev"
}

Write-Host "Worker URL: $workerUrl" -ForegroundColor Yellow

# Create user via register endpoint
$body = @{
    email = $Email
    password = $Password
} | ConvertTo-Json

try {
    Write-Host "`nSending registration request..." -ForegroundColor Cyan
    
    $response = Invoke-RestMethod -Uri "$workerUrl/auth/register" `
        -Method Post `
        -Body $body `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    if ($response.ok) {
        Write-Host "`n✅ User created successfully!" -ForegroundColor Green
        Write-Host "User ID: $($response.user.id)" -ForegroundColor Green
        Write-Host "Email: $($response.user.email)" -ForegroundColor Green
        Write-Host "Token: $($response.token.Substring(0, 50))..." -ForegroundColor Gray
    } else {
        Write-Host "`n❌ Failed to create user" -ForegroundColor Red
        Write-Host "Error: $($response.error)" -ForegroundColor Red
        Write-Host "Message: $($response.message)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "`n❌ Error occurred:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "Error Code: $($errorDetails.code)" -ForegroundColor Red
        Write-Host "Error Message: $($errorDetails.message)" -ForegroundColor Red
        
        if ($errorDetails.code -eq "EMAIL_EXISTS") {
            Write-Host "`n⚠️ User already exists. Try logging in instead." -ForegroundColor Yellow
        }
    }
    
    exit 1
}

Write-Host "`n✅ Done!" -ForegroundColor Green

