# تشغيل Worker محلياً
# Run Worker locally

Write-Host "🚀 Starting MBUY Worker..." -ForegroundColor Cyan

# Set environment variables
$env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/mbuy_dev"
$env:REDIS_URL = "redis://localhost:6379"
$env:JWT_SECRET = "dev-secret-key-12345"
$env:PORT = "8787"

# Navigate to worker directory and run
Set-Location $PSScriptRoot
npx tsx watch dev-server.ts
