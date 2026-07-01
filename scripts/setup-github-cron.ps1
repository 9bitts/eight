# Configura secrets do GitHub Actions para backup do cron HTTP (a cada 5 min).
# Pré-requisito: gh auth login
#
# Uso: npm run github:cron:setup

$ErrorActionPreference = "Stop"

Write-Host "=== Eight — GitHub Actions cron (backup) ===" -ForegroundColor Cyan

try {
    gh auth status 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "gh não autenticado" }
} catch {
    Write-Host "Faça login: gh auth login" -ForegroundColor Yellow
    exit 1
}

$siteUrl = Read-Host "URL do site em produção (ex: https://eight.up.railway.app)"
$siteUrl = $siteUrl.TrimEnd("/")

$cronSecret = Read-Host "CRON_SECRET (mesmo valor do Railway/.env)"
if (-not $cronSecret) {
    Write-Host "CRON_SECRET é obrigatório." -ForegroundColor Red
    exit 1
}

gh secret set SITE_URL --body $siteUrl --repo 9bitts/eight
gh secret set CRON_SECRET --body $cronSecret --repo 9bitts/eight

Write-Host ""
Write-Host "Secrets configurados. Workflow: .github/workflows/publish-scheduled.yml" -ForegroundColor Green
Write-Host "Dispare manualmente: gh workflow run publish-scheduled.yml --repo 9bitts/eight"
