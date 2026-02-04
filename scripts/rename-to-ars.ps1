# Script to rename Agentic Reserve System (ARS) to Agentic Reserve System (ARS)
# This script will update all references across the codebase

Write-Host "🔄 Starting rename to Agentic Reserve System (ARS)..." -ForegroundColor Cyan
Write-Host ""

# Define replacement patterns
$replacements = @(
    @{
        Old = "Agentic Reserve System"
        New = "Agentic Reserve System"
    },
    @{
        Old = "internet-capital-bank"
        New = "agentic-reserve-system"
    },
    @{
        Old = "ARS"
        New = "ARS"
    },
    @{
        Old = "ARU"
        New = "ARU"
    },
    @{
        Old = "ars-"
        New = "ars-"
    },
    @{
        Old = "icb_"
        New = "ars_"
    }
)

# Directories to process
$directories = @(
    ".openclaw",
    ".kiro",
    "backend",
    "documentation",
    "frontend",
    "programs",
    "scripts",
    "supabase"
)

# File extensions to process
$extensions = @("*.md", "*.ts", "*.tsx", "*.js", "*.json", "*.toml", "*.rs", "*.sh", "*.ps1", "*.yml", "*.yaml", "*.sql", "*.txt")

# Root files to process
$rootFiles = @(
    "README.md",
    "QUICK_START.md",
    "RAILWAY_DEPLOYMENT.md",
    "Anchor.toml",
    "Cargo.toml",
    "package.json",
    "docker-compose.yml",
    "railway.toml",
    "railway.json",
    "ecosystem.config.js"
)

$filesProcessed = 0
$replacementsMade = 0

# Function to replace content in file
function Replace-Content {
    param (
        [string]$FilePath
    )
    
    try {
        $content = Get-Content -Path $FilePath -Raw -ErrorAction Stop
        $originalContent = $content
        
        foreach ($replacement in $replacements) {
            $content = $content -replace [regex]::Escape($replacement.Old), $replacement.New
        }
        
        if ($content -ne $originalContent) {
            Set-Content -Path $FilePath -Value $content -NoNewline
            $script:replacementsMade++
            Write-Host "  ✓ Updated: $FilePath" -ForegroundColor Green
        }
        
        $script:filesProcessed++
    }
    catch {
        Write-Host "  ✗ Error processing $FilePath : $_" -ForegroundColor Red
    }
}

# Process root files
Write-Host "Processing root files..." -ForegroundColor Yellow
foreach ($file in $rootFiles) {
    if (Test-Path $file) {
        Replace-Content -FilePath $file
    }
}

# Process directories
foreach ($dir in $directories) {
    if (Test-Path $dir) {
        Write-Host "`nProcessing directory: $dir" -ForegroundColor Yellow
        
        foreach ($ext in $extensions) {
            $files = Get-ChildItem -Path $dir -Filter $ext -Recurse -File -ErrorAction SilentlyContinue
            
            foreach ($file in $files) {
                # Skip node_modules and target directories
                if ($file.FullName -notmatch "node_modules|target|\.git") {
                    Replace-Content -FilePath $file.FullName
                }
            }
        }
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "✅ Rename complete!" -ForegroundColor Green
Write-Host "Files processed: $filesProcessed" -ForegroundColor Cyan
Write-Host "Files updated: $replacementsMade" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  IMPORTANT: Manual steps required:" -ForegroundColor Yellow
Write-Host "1. Rename folder: programs/ars-core → programs/ars-core" -ForegroundColor White
Write-Host "2. Rename folder: programs/ars-reserve → programs/ars-reserve" -ForegroundColor White
Write-Host "3. Rename folder: programs/ars-token → programs/ars-token" -ForegroundColor White
Write-Host "4. Rename folder: ars-protocol → ars-protocol" -ForegroundColor White
Write-Host "5. Update Anchor.toml program paths" -ForegroundColor White
Write-Host "6. Run: anchor build" -ForegroundColor White
Write-Host "7. Update program IDs in Anchor.toml" -ForegroundColor White
Write-Host "8. Commit changes to git" -ForegroundColor White
Write-Host ""
