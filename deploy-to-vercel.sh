#!/bin/bash

# Deploy to Vercel-Connected Repository (kumii-dev)
# This script helps push to kumii-dev/marketplace-firebase which triggers Vercel deployment

echo "🚀 Deploy to Vercel via kumii-dev repository"
echo "=============================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Must run from project root (package.json not found)"
    exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  Warning: You have uncommitted changes"
    echo ""
    read -p "Commit them first? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git status
        echo ""
        read -p "Enter commit message: " commit_msg
        git add .
        git commit -m "$commit_msg"
    else
        echo "❌ Aborted. Commit your changes first."
        exit 1
    fi
fi

echo ""
echo "📝 Latest commit:"
git log --oneline -1
echo ""

# Option 1: Check if kumii remote already has token
echo "Attempting to push to kumii remote..."
echo ""

if git push kumii main 2>&1 | grep -q "Everything up-to-date"; then
    echo "✅ Already up-to-date!"
    echo ""
    echo "🌐 Check deployment at: https://vercel.com/dashboard"
    echo "🔍 Test: https://marketplace-firebase.vercel.app/api/health/status"
    exit 0
fi

# If push failed, prompt for token
echo ""
echo "⚠️  Push failed (authentication needed)"
echo ""
echo "To push to kumii-dev repository, you need a Personal Access Token:"
echo ""
echo "1. Login to GitHub as kumii-dev"
echo "2. Go to: https://github.com/settings/tokens"
echo "3. Generate new token (classic) with 'repo' scope"
echo "4. Copy the token"
echo ""
read -p "Enter your kumii-dev GitHub token: " github_token

if [ -z "$github_token" ]; then
    echo "❌ No token provided. Aborted."
    exit 1
fi

echo ""
echo "🚀 Pushing to kumii-dev/marketplace-firebase..."
echo ""

# Push with token
if git push https://${github_token}@github.com/kumii-dev/marketplace-firebase.git main; then
    echo ""
    echo "✅ Successfully pushed to kumii-dev!"
    echo ""
    echo "📦 Vercel will now build and deploy (2-3 minutes)"
    echo ""
    echo "Next steps:"
    echo "1. Monitor deployment: https://vercel.com/dashboard"
    echo "2. Test health: curl https://marketplace-firebase.vercel.app/api/health/status"
    echo "3. Test dashboard: https://marketplace-firebase.vercel.app/dashboard"
    echo ""
    
    # Ask if user wants to save token in remote
    read -p "Save token in kumii remote for future pushes? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git remote set-url kumii https://${github_token}@github.com/kumii-dev/marketplace-firebase.git
        echo "✅ Token saved. Future pushes: git push kumii main"
    else
        echo "ℹ️  Token not saved. You'll need to provide it again for future pushes."
    fi
else
    echo ""
    echo "❌ Push failed. Check your token and try again."
    exit 1
fi
