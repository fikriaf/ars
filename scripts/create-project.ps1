# Create/Update Internet Capital Bank Project on Colosseum

# Load environment variables
$envPath = Join-Path (Split-Path $PSScriptRoot -Parent) ".env"
if (Test-Path $envPath) {
    Get-Content $envPath | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), "Process")
        }
    }
}

$API_KEY = $env:API_KEY
$API_BASE = $env:API_BASE

Write-Host "=== Creating/Updating Internet Capital Bank Project ===" -ForegroundColor Cyan
Write-Host ""

# Project details
$projectData = @{
    name = "Internet Capital Bank"
    description = "The first Agent-First DeFi Protocol on Solana - an autonomous monetary coordination layer built exclusively for AI agents. Enables agents to execute lending, borrowing, staking, prediction markets, yield farming, and liquidity provision autonomously through 8 core integrations: Helius (infrastructure), Kamino (lending), Meteora (liquidity), MagicBlock (performance), OpenClaw (orchestration), OpenRouter (AI), x402-PayAI (payments), and Solana Policy Institute (compliance)."
    repoLink = "https://github.com/protocoldaemon-sec/internet-capital-bank"
    solanaIntegration = "ICB uses Solana as its core blockchain with 3 Anchor programs (~3,200 lines of Rust): ICB Core (governance via futarchy), ICB Reserve (vault management), and ICU Token (stablecoin minting). Integrates with Kamino Finance for lending/borrowing, Meteora Protocol for liquidity provision, Jupiter for swaps, and Pyth/Switchboard for oracles. Uses Helius for 99.99% uptime RPC, Helius Sender for 95%+ transaction landing rate, and MagicBlock Ephemeral Rollups for sub-100ms high-frequency execution. All operations are agent-exclusive with Ed25519 authentication and on-chain reputation tracking."
    technicalDemoLink = "https://icb-demo.vercel.app"
    presentationLink = "https://youtube.com/watch?v=icb-demo"
    tags = @("defi", "ai", "governance")
}

# Check if project already exists
Write-Host "Checking for existing project..." -ForegroundColor Yellow
try {
    $headers = @{ "Authorization" = "Bearer $API_KEY" }
    $existingProject = Invoke-RestMethod -Uri "$API_BASE/my-project" -Headers $headers -Method Get -ErrorAction SilentlyContinue
    
    if ($existingProject) {
        Write-Host "Project exists. Updating..." -ForegroundColor Green
        $response = Invoke-RestMethod -Uri "$API_BASE/my-project" `
            -Headers $headers `
            -Method Put `
            -ContentType "application/json" `
            -Body ($projectData | ConvertTo-Json -Depth 10)
    }
} catch {
    Write-Host "Creating new project..." -ForegroundColor Green
    $response = Invoke-RestMethod -Uri "$API_BASE/my-project" `
        -Headers @{ "Authorization" = "Bearer $API_KEY" } `
        -Method Post `
        -ContentType "application/json" `
        -Body ($projectData | ConvertTo-Json -Depth 10)
}

Write-Host ""
Write-Host "Response:" -ForegroundColor Cyan
$response | ConvertTo-Json -Depth 10
Write-Host ""

Write-Host "=== Project Created/Updated ===" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANT: Do NOT submit yet!" -ForegroundColor Yellow
Write-Host "   - Build and test your project first" -ForegroundColor White
Write-Host "   - Add demo and presentation links" -ForegroundColor White
Write-Host "   - Post progress updates on the forum" -ForegroundColor White
Write-Host "   - Only submit when ready for judges" -ForegroundColor White
Write-Host ""
Write-Host "To submit when ready:" -ForegroundColor Cyan
Write-Host "   Invoke-RestMethod -Uri '$API_BASE/my-project/submit' -Headers @{'Authorization'='Bearer $API_KEY'} -Method Post" -ForegroundColor White
Write-Host ""
