# Setup missing MBUY Auth Secrets

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setting up missing MBUY Auth Secrets" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check current secrets
Write-Host "Checking current secrets..." -ForegroundColor Yellow
$currentSecrets = npx wrangler secret list | ConvertFrom-Json
$secretNames = $currentSecrets | ForEach-Object { $_.name }

$needsServiceRoleKey = -not ($secretNames -contains "SUPABASE_SERVICE_ROLE_KEY")
$needsJwtSecret = -not ($secretNames -contains "JWT_SECRET")
$needsPasswordRounds = -not ($secretNames -contains "PASSWORD_HASH_ROUNDS")

if (-not $needsServiceRoleKey -and -not $needsJwtSecret -and -not $needsPasswordRounds) {
    Write-Host "All secrets are already set!" -ForegroundColor Green
    exit 0
}

Write-Host ""

# 1. SUPABASE_SERVICE_ROLE_KEY
if ($needsServiceRoleKey) {
    Write-Host "1. Setting SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Yellow
    Write-Host "   Go to: https://supabase.com/dashboard/project/sirqidofuvphqcxqchyc/settings/api" -ForegroundColor Gray
    Write-Host "   Copy the 'service_role' key (long key)" -ForegroundColor Gray
    Write-Host ""
    
    # Check if SUPABASE_SERVICE_KEY exists
    if ($secretNames -contains "SUPABASE_SERVICE_KEY") {
        Write-Host "   Found SUPABASE_SERVICE_KEY - make sure it's the correct Service Role Key" -ForegroundColor Yellow
    }
    
    Write-Host "   Enter Service Role Key:" -ForegroundColor Cyan
    $serviceRoleKey = Read-Host "   "
    
    if ($serviceRoleKey -and $serviceRoleKey.Length -gt 10) {
        echo $serviceRoleKey | npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
        Write-Host "   Successfully added SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Green
    } else {
        Write-Host "   Skipped SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Red
    }
    Write-Host ""
}

# 2. JWT_SECRET
if ($needsJwtSecret) {
    Write-Host "2. Setting JWT_SECRET" -ForegroundColor Yellow
    Write-Host "   Must be a strong key (32+ characters)" -ForegroundColor Gray
    Write-Host ""
    
    # Generate a random key
    $randomKey = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    Write-Host "   Suggested random key: $randomKey" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "   Enter JWT_SECRET (press Enter to use suggested key):" -ForegroundColor Cyan
    $jwtSecret = Read-Host "   "
    
    if ([string]::IsNullOrWhiteSpace($jwtSecret)) {
        $jwtSecret = $randomKey
    }
    
    if ($jwtSecret -and $jwtSecret.Length -ge 32) {
        echo $jwtSecret | npx wrangler secret put JWT_SECRET
        Write-Host "   Successfully added JWT_SECRET" -ForegroundColor Green
    } else {
        Write-Host "   JWT_SECRET must be at least 32 characters" -ForegroundColor Red
    }
    Write-Host ""
}

# 3. PASSWORD_HASH_ROUNDS (optional)
if ($needsPasswordRounds) {
    Write-Host "3. Setting PASSWORD_HASH_ROUNDS (optional)" -ForegroundColor Yellow
    Write-Host "   Default value: 100000" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "   Enter PASSWORD_HASH_ROUNDS (press Enter for default):" -ForegroundColor Cyan
    $rounds = Read-Host "   "
    
    if ([string]::IsNullOrWhiteSpace($rounds)) {
        $rounds = "100000"
    }
    
    echo $rounds | npx wrangler secret put PASSWORD_HASH_ROUNDS
    Write-Host "   Successfully added PASSWORD_HASH_ROUNDS: $rounds" -ForegroundColor Green
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Green
Write-Host "Secrets setup completed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Verifying secrets..." -ForegroundColor Cyan
npx wrangler secret list
