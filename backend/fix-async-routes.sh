#!/bin/bash
# Script to convert synchronous getData() calls to async/await in route files

echo "🔧 Converting route files to async/await pattern..."

# Array of route files with getData() calls
ROUTE_FILES=(
  "routes/admin.js"
  "routes/messages.js"
  "routes/startups.js"
  "routes/subscriptions.js"
  "routes/tenants.js"
  "routes/users.js"
  "routes/vendors.js"
  "routes/wallets.js"
)

for file in "${ROUTE_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing: $file"
    
    # Create backup
    cp "$file" "$file.backup"
    
    # Step 1: Convert route handlers to async
    # Match patterns like: router.get("/path", middleware, (req, res) => {
    # and convert to: router.get("/path", middleware, async (req, res) => {
    sed -i '' -E 's/router\.(get|post|put|patch|delete)\((.*), \(req, res\) => \{/router.\1(\2, async (req, res) => {/g' "$file"
    
    # Step 2: Convert getData() calls to await getData()
    sed -i '' -E 's/const ([a-zA-Z0-9_]+) = getData\(\)/const \1 = await getData()/g' "$file"
    sed -i '' -E 's/const \{ ([^}]+) \} = getData\(\)/const { \1 } = await getData()/g' "$file"
    
    echo "✅ Converted: $file"
  else
    echo "⚠️  File not found: $file"
  fi
done

echo "🎉 Conversion complete! Backup files created with .backup extension"
echo "⚠️  Please review changes manually before committing"
