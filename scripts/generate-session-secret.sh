#!/bin/bash
# generate-session-secret.sh
# Generates a secure random session secret for Vercel deployment

echo "🔐 Generating secure session secret..."
echo ""

# Generate a 64-character hex string
SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

echo "Generated SESSION_SECRET:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "$SECRET"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Add this to your Vercel environment variables:"
echo "   Variable name: SESSION_SECRET"
echo "   Value: $SECRET"
echo ""
echo "⚠️  Keep this secret secure and never commit it to git!"
