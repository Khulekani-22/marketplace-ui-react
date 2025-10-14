#!/bin/bash
# Script to convert saveData() calls to await saveData() in route files

echo "🔧 Converting saveData() calls to async/await pattern..."

# Array of route files with saveData() calls
ROUTE_FILES=(
  "routes/admin.js"
  "routes/messages.js"
  "routes/services.js"
  "routes/users.js"
  "routes/wallets.js"
)

for file in "${ROUTE_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing: $file"
    
    # Convert standalone saveData calls to await
    # Pattern: saveData((
    sed -i '' -E 's/([[:space:]]+)saveData\(/\1await saveData(/g' "$file"
    
    # Convert const assignments with saveData to await
    # Pattern: const x = saveData(
    sed -i '' -E 's/const ([a-zA-Z0-9_]+) = saveData\(/const \1 = await saveData(/g' "$file"
    
    echo "✅ Converted saveData() to await: $file"
  else
    echo "⚠️  File not found: $file"
  fi
done

echo "🎉 saveData() conversion complete!"
