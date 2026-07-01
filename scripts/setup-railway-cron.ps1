# Configura o serviço de cron no Railway (posts agendados).
# Pré-requisito: npx railway login
#
# Uso: npm run railway:cron:setup

$ErrorActionPreference = "Stop"

$ServiceName = "eight-publish-cron"
$Repo = "9bitts/eight"
$ConfigPath = "/railway.cron.toml"

function Invoke-Railway {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Args)
    & npx --yes @railway/cli @Args
    if ($LASTEXITCODE -ne 0) { throw "Comando falhou: railway $($Args -join ' ')" }
}

Write-Host "=== Eight — setup cron Railway ===" -ForegroundColor Cyan

try {
    Invoke-Railway whoami
} catch {
    Write-Host ""
    Write-Host "Faça login no Railway primeiro:" -ForegroundColor Yellow
    Write-Host "  npx railway login"
    Write-Host ""
    exit 1
}

if (-not (Test-Path ".railway")) {
    Write-Host "Vinculando ao projeto Railway (escolha o projeto eight)..."
    Invoke-Railway link
}

Write-Host "Serviços no ambiente:"
Invoke-Railway service list

$servicesJson = npx --yes @railway/cli service list --json 2>$null
$serviceExists = $false
if ($servicesJson) {
    $services = $servicesJson | ConvertFrom-Json
    $serviceExists = $null -ne ($services | Where-Object { $_.name -eq $ServiceName })
}

if (-not $serviceExists) {
    Write-Host "Criando serviço '$ServiceName'..."
    Invoke-Railway add --service $ServiceName --repo $Repo --json
} else {
    Write-Host "Serviço '$ServiceName' já existe."
}

Write-Host "Conectando repositório ao serviço de cron..."
Invoke-Railway service source connect --repo $Repo --service $ServiceName 2>$null

Write-Host "Vinculando CLI ao serviço de cron..."
Invoke-Railway service link $ServiceName

Write-Host ""
Write-Host "Configure DATABASE_URL (referência ao Postgres do projeto):" -ForegroundColor Yellow
Write-Host "  npx railway variable set DATABASE_URL='`${{Postgres.DATABASE_URL}}' --service $ServiceName"
Write-Host "  (substitua 'Postgres' pelo nome do seu serviço de banco no Railway)"
Write-Host ""
Write-Host "No Dashboard Railway → serviço '$ServiceName' → Settings:" -ForegroundColor Yellow
Write-Host "  Config-as-code file path: $ConfigPath"
Write-Host "  (cronSchedule */5 * * * * UTC — vem do railway.cron.toml)"
Write-Host ""

$deploy = Read-Host "Fazer deploy agora? (s/N)"
if ($deploy -eq "s" -or $deploy -eq "S") {
    Invoke-Railway up --service $ServiceName
    Write-Host "Deploy iniciado. Logs: npx railway logs --service $ServiceName" -ForegroundColor Green
}

Write-Host ""
Write-Host "Concluído. Teste local: npm run cron:publish-scheduled" -ForegroundColor Green
