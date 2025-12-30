# PowerShell script to setup MBUY Auth Secrets
# Run this script to set up all required secrets

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "MBUY Auth Secrets Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. SUPABASE_SERVICE_ROLE_KEY
Write-Host "1. Setting SUPABASE_SERVICE_ROLE_KEY..." -ForegroundColor Yellow
Write-Host "   Please enter your Supabase Service Role Key:" -ForegroundColor Gray
Write-Host "   (Get it from: Supabase Dashboard → Project Settings → API → service_role key)" -ForegroundColor Gray
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY

# 2. JWT_SECRET
Write-Host ""
Write-Host "2. Setting JWT_SECRET..." -ForegroundColor Yellow
Write-Host "   Generating a secure random key..." -ForegroundColor Gray
$jwtSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
Write-Host "   Generated key: $jwtSecret" -ForegroundColor Green
Write-Host "   Please confirm or enter your own JWT_SECRET:" -ForegroundColor Gray
$jwtSecretInput = Read-Host "   Enter JWT_SECRET (press Enter to use generated key)"
if ([string]::IsNullOrWhiteSpace($jwtSecretInput)) {
    $jwtSecretInput = $jwtSecret
}
echo $jwtSecretInput | npx wrangler secret put JWT_SECRET

# 3. PASSWORD_HASH_ROUNDS (optional)
Write-Host ""
Write-Host "3. Setting PASSWORD_HASH_ROUNDS (optional)..." -ForegroundColor Yellow
Write-Host "   Default: 100000" -ForegroundColor Gray
$rounds = Read-Host "   Enter PASSWORD_HASH_ROUNDS (press Enter for default: 100000)"
if ([string]::IsNullOrWhiteSpace($rounds)) {
    $rounds = "100000"
}
echo $rounds | npx wrangler secret put PASSWORD_HASH_ROUNDS

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ All secrets have been set!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Verifying secrets..." -ForegroundColor Cyan
npx wrangler secret list

