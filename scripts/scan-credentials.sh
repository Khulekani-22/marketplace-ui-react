#!/bin/bash
# Script to help identify and fix hardcoded credentials

echo "🔍 Scanning for hardcoded Firebase API keys..."
echo ""

WORKSPACE="/Applications/XAMPP/xamppfiles/htdocs/firebase sloane hub/ui/marketplace-ui-react"
cd "$WORKSPACE"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "📁 Files with hardcoded API keys:"
echo "=================================="

# Find Firebase API keys
grep -r "AIza[0-9A-Za-z_-]\{35\}" \
  --exclude-dir=node_modules \
  --exclude-dir=.git \
  --exclude-dir=dist \
  --exclude="*.md" \
  --exclude="SECURITY_FIX_URGENT.md" \
  . 2>/dev/null | while read -r line; do
    echo -e "${RED}✗${NC} $line"
done

echo ""
echo "📁 Files with service account keys:"
echo "===================================="

find . -name "serviceAccountKey.json" -not -path "*/node_modules/*" -not -path "*/.git/*" 2>/dev/null | while read -r file; do
    echo -e "${RED}✗${NC} $file"
done

echo ""
echo "📁 .env files (should NOT be in Git):"
echo "======================================"

find . -name ".env" -not -path "*/node_modules/*" -not -path "*/.git/*" 2>/dev/null | while read -r file; do
    if git ls-files --error-unmatch "$file" 2>/dev/null; then
        echo -e "${RED}✗ TRACKED IN GIT:${NC} $file"
    else
        echo -e "${GREEN}✓ Not tracked:${NC} $file"
    fi
done

echo ""
echo "📊 Summary:"
echo "==========="
echo ""
echo -e "${YELLOW}ACTION REQUIRED:${NC}"
echo "1. Rotate all Firebase credentials immediately"
echo "2. Run BFG Repo-Cleaner to remove from Git history"
echo "3. Update files to use environment variables"
echo "4. Force push to GitHub after rotating credentials"
echo ""
echo "See SECURITY_FIX_URGENT.md for detailed instructions"
