# Script to remove old GitHub credentials
Write-Host "=== Cleaning Old GitHub Credentials ===" -ForegroundColor Cyan
Write-Host ""

# Method 1: Using git credential fill/reject
Write-Host "Method 1: Using git credential reject..." -ForegroundColor Yellow
$credInput = @"
protocol=https
host=api.github.com
username=mbuy1
"@

try {
    $credInput | git credential reject
    Write-Host "  Success: Git credential rejected for mbuy1" -ForegroundColor Green
} catch {
    Write-Host "  Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Method 2: Clear all GitHub credentials
Write-Host "Method 2: Clearing all GitHub credentials..." -ForegroundColor Yellow
$credInput2 = @"
protocol=https
host=github.com
"@

try {
    $credInput2 | git credential reject
    Write-Host "  Success: All GitHub credentials cleared" -ForegroundColor Green
} catch {
    Write-Host "  Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Current Stored Credentials ===" -ForegroundColor Cyan
Write-Host ""

# List remaining credentials
$output = cmdkey /list | Select-String -Pattern "github" -Context 1,2
if ($output) {
    Write-Host "Found GitHub credentials:" -ForegroundColor Yellow
    $output | ForEach-Object { Write-Host $_.Line }
} else {
    Write-Host "No GitHub credentials found in Credential Manager" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Manual Cleanup Steps ===" -ForegroundColor Cyan
Write-Host "If credentials still exist:"
Write-Host "1. Press Win+R"
Write-Host "2. Type: control /name Microsoft.CredentialManager"
Write-Host "3. Click Windows Credentials"
Write-Host "4. Find and remove any GitHub entries"
Write-Host ""
