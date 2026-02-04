# Script to rename Agentic Reserve System (ARS) to Agentic Capital Bank (ACB)
# This script will update all references across the codebase

Write-Host "🔄 Starting ARS to ACB rename process..." -ForegroundColor Cyan

# Define replacement patterns
$replacements = @(
    @{
        Old = "Agentic Reserve System"
        New = "Agentic Capital Bank"
    },
    @{
        Old = "internet-capital-bank"
        New = "agentic-capital-bank"
    },
    @{
        Old = "ARS"
        New = "ACB"
    },
    @{
        Old = "icb"
        New = "acb"
    }
)

# Files and directories to process
$filesToProcess = @(
    "README.md",
    "QUICK_START.md",
    "package.json",
    ".openclaw/config.json",
    ".openclaw/swarm-config.json",
    ".openclaw/skills/*.md",
    "backend/package.json",
    "backend/src/**/*.ts",
    "backend/src/**/*.js",
    "frontend/package.json",
    "frontend/src/**/*.tsx",
    "frontend/src/**/*.ts",
    "documentation/**/*.md",
    "scripts/*.sh",
    "scripts/*.ps1",
    "supabase/*.sql",
    ".kiro/specs/**/*.md"
)

$filesChanged = 0

foreach ($pattern in $filesToProcess) {
    $files = Get-ChildItem -Path $pattern -Recurse -File -ErrorAction SilentlyContinue
    
    foreach ($file in $files) {
        $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
        
        if ($null -eq $content) {
            continue
        }
        
        $originalContent = $content
        
        # Apply all replacements
        foreach ($replacement in $replacements) {
            $content = $content -replace [regex]::Escape($replacement.Old), $replacement.New
        }
        
        # Only write if content changed
        if ($content -ne $originalContent) {
            Set-Content -Path $file.FullName -Value $content -NoNewline
            Write-Host "✅ Updated: $($file.FullName)" -ForegroundColor Green
            $filesChanged++
        }
    }
}

Write-Host "`n📊 Summary:" -ForegroundColor Cyan
Write-Host "   Files changed: $filesChanged" -ForegroundColor Yellow

Write-Host "`n⚠️  Manual steps required:" -ForegroundColor Yellow
Write-Host "   1. Rename .kiro/specs/internet-central-bank/ to .kiro/specs/agentic-capital-bank/" -ForegroundColor White
Write-Host "   2. Update GitHub repository name (if desired)" -ForegroundColor White
Write-Host "   3. Update Colosseum project name" -ForegroundColor White
Write-Host "   4. Review and commit changes" -ForegroundColor White

Write-Host "`nRename process complete!" -ForegroundColor Green
