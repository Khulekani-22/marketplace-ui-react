#!/bin/bash

# Quick Firebase User Checker
# This script helps verify your Firebase user exists

echo "🔍 Checking Firebase User..."
echo ""

API_KEY="${1:-AIzaSyDFzUfv1enm5_lucOMz4tWh26GJfIG751M}"

echo "📋 Firebase Project Info:"
echo "   API Key: ${API_KEY:0:20}..."
echo ""

# Try to get auth info
echo "Checking Firebase Auth configuration..."
echo ""

# You can manually check at:
echo "✅ Manual Check Steps:"
echo ""
echo "1. Go to: https://console.firebase.google.com"
echo "2. Select your project"
echo "3. Click 'Authentication' in left menu"
echo "4. Click 'Users' tab"
echo "5. Look for: 22onsloanedigitalteam@gmail.com"
echo ""
echo "📧 Expected User:"
echo "   Email: 22onsloanedigitalteam@gmail.com"
echo ""
echo "❓ Possible Issues:"
echo "   • User doesn't exist - Create it in Firebase Console"
echo "   • Wrong password - Reset in Firebase Console"
echo "   • Email/Password auth not enabled - Enable in Authentication → Sign-in method"
echo "   • User is disabled - Check user status in Firebase Console"
echo ""
echo "🔧 To Create User:"
echo "   1. Firebase Console → Authentication → Users"
echo "   2. Click 'Add user'"
echo "   3. Enter: 22onsloanedigitalteam@gmail.com"
echo "   4. Set password"
echo "   5. Click 'Add user'"
echo ""
echo "🔑 To Reset Password:"
echo "   1. Firebase Console → Authentication → Users"
echo "   2. Find user: 22onsloanedigitalteam@gmail.com"
echo "   3. Click three dots → Reset password"
echo "   4. Follow instructions"
echo ""
