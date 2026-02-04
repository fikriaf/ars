#!/bin/bash
# Script to rename Agentic Reserve System (ARS) to Agentic Reserve System (ARS)
# This script will update all references across the codebase

echo "🔄 Starting rename to Agentic Reserve System (ARS)..."
echo ""

# Function to replace content in file
replace_in_file() {
    local file="$1"
    
    if [ ! -f "$file" ]; then
        return
    fi
    
    # Create backup
    cp "$file" "$file.bak" 2>/dev/null || return
    
    # Perform replacements (Git Bash compatible)
    sed -i.tmp 's/Agentic Reserve System/Agentic Reserve System/g' "$file" 2>/dev/null || return
    sed -i.tmp 's/internet-capital-bank/agentic-reserve-system/g' "$file" 2>/dev/null || return
    sed -i.tmp 's/\bICB\b/ARS/g' "$file" 2>/dev/null || return
    sed -i.tmp 's/\bICU\b/ARU/g' "$file" 2>/dev/null || return
    sed -i.tmp 's/ars-/ars-/g' "$file" 2>/dev/null || return
    sed -i.tmp 's/icb_/ars_/g' "$file" 2>/dev/null || return
    
    # Clean up
    rm -f "$file.tmp" "$file.bak" 2>/dev/null
    
    echo "  ✓ Updated: $file"
}

# Process root files
echo "Processing root files..."
for file in README.md QUICK_START.md RAILWAY_DEPLOYMENT.md Anchor.toml Cargo.toml package.json docker-compose.yml railway.toml railway.json ecosystem.config.js; do
    if [ -f "$file" ]; then
        replace_in_file "$file"
    fi
done

# Process directories
for dir in .openclaw .kiro backend documentation frontend programs scripts supabase; do
    if [ -d "$dir" ]; then
        echo ""
        echo "Processing directory: $dir"
        
        # Find all text files, excluding node_modules and target
        find "$dir" -type f \( -name "*.md" -o -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.json" -o -name "*.toml" -o -name "*.rs" -o -name "*.sh" -o -name "*.ps1" -o -name "*.yml" -o -name "*.yaml" -o -name "*.sql" -o -name "*.txt" \) 2>/dev/null | grep -v "node_modules" | grep -v "/target/" | grep -v "/.git/" | while read -r file; do
            replace_in_file "$file"
        done
    fi
done

echo ""
echo "========================================"
echo "✅ Content replacement complete!"
echo ""
echo "⚠️  IMPORTANT: Manual steps required:"
echo "1. Rename folders:"
echo "   mv programs/ars-core programs/ars-core"
echo "   mv programs/ars-reserve programs/ars-reserve"
echo "   mv programs/ars-token programs/ars-token"
echo "   mv ars-protocol ars-protocol"
echo ""
echo "2. Update Anchor.toml program paths"
echo "3. Run: anchor build"
echo "4. Update program IDs in Anchor.toml"
echo "5. Commit changes to git"
echo ""
