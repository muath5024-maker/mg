# GitHub Authentication Test Script
Write-Host "GitHub Authentication Test" -ForegroundColor Cyan
Write-Host ""

# Check git config
Write-Host "Git Configuration:" -ForegroundColor Yellow
$username = git config --global user.name
$email = git config --global user.email
Write-Host "  Username: $username"
Write-Host "  Email: $email"
Write-Host ""

# Check remote URL
Write-Host "Remote URL:" -ForegroundColor Yellow
Set-Location "c:\muath\saleh"
$remoteUrl = git remote get-url origin
Write-Host "  Origin: $remoteUrl"
Write-Host ""

# Check current branch
Write-Host "Current Branch:" -ForegroundColor Yellow
$branch = git branch --show-current
Write-Host "  Branch: $branch"
Write-Host ""

# Test connection
Write-Host "Testing Connection..." -ForegroundColor Yellow
git ls-remote origin
Write-Host ""
Write-Host "Test complete!"
