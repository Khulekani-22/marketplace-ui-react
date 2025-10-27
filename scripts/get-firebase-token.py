#!/usr/bin/env python3

"""
Get Firebase ID Token - Simple Python Version
Usage: python3 scripts/get-firebase-token.py EMAIL PASSWORD
"""

import sys
import json
import urllib.request
import urllib.parse

# Firebase Web API Key
API_KEY = "AIzaSyDFzUfv1enm5_lucOMz4tWh26GJfIG751M"

if len(sys.argv) < 3:
    print("❌ Error: Email and password required")
    print("\nUsage:")
    print("  python3 scripts/get-firebase-token.py EMAIL PASSWORD")
    print("\nExample:")
    print('  python3 scripts/get-firebase-token.py 22onsloanedigitalteam@gmail.com "Sloane22Gen!"')
    sys.exit(1)

email = sys.argv[1]
password = sys.argv[2]

print("🔐 Signing in to Firebase...")
print(f"📧 Email: {email}")
print()

# Firebase Auth REST API
url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={API_KEY}"
data = {
    "email": email,
    "password": password,
    "returnSecureToken": True
}

try:
    # Make request
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    
    with urllib.request.urlopen(req) as response:
        result = json.loads(response.read().decode('utf-8'))
    
    # Success!
    print("✅ Successfully authenticated!")
    print()
    print("📋 User Info:")
    print(f"   Email: {result['email']}")
    print(f"   UID: {result['localId']}")
    print(f"   Expires in: {result['expiresIn']}s (1 hour)")
    print()
    print("🎫 Firebase ID Token:")
    print("─" * 80)
    print(result['idToken'])
    print("─" * 80)
    print()
    print("🔄 Refresh Token (save for later):")
    print(result['refreshToken'][:50] + "...")
    print()
    print("📌 How to use in Postman:")
    print("1. Open your collection → Variables tab")
    print("2. Set firebase_token = [copy token above]")
    print("3. Test with any authenticated endpoint")
    print()
    print("🔧 Quick test command:")
    token_preview = result['idToken'][:50]
    print(f'   curl -H "Authorization: Bearer {token_preview}..." \\')
    print("        http://localhost:5055/api/me")
    print()
    
    # Save to file option
    save = input("💾 Save token to .env.firebase-token file? [y/N]: ").strip().lower()
    if save == 'y':
        from datetime import datetime
        with open('.env.firebase-token', 'w') as f:
            f.write(f"# Firebase Authentication Token\n")
            f.write(f"# Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"# Expires in: 1 hour\n\n")
            f.write(f"FIREBASE_TOKEN={result['idToken']}\n")
            f.write(f"FIREBASE_REFRESH_TOKEN={result['refreshToken']}\n")
            f.write(f"FIREBASE_USER_ID={result['localId']}\n")
            f.write(f"FIREBASE_EMAIL={result['email']}\n")
        print("✅ Saved to .env.firebase-token")
        print("   Source it with: source .env.firebase-token")

except urllib.error.HTTPError as e:
    error_data = json.loads(e.read().decode('utf-8'))
    print("❌ Authentication failed:")
    print(json.dumps(error_data, indent=2))
    print()
    
    if 'error' in error_data:
        error_msg = error_data['error'].get('message', '')
        
        if 'INVALID_LOGIN_CREDENTIALS' in error_msg or 'INVALID_PASSWORD' in error_msg:
            print("💡 Wrong email or password")
            print("   Check your credentials or reset password")
        elif 'EMAIL_NOT_FOUND' in error_msg:
            print("💡 No user found with this email")
            print("   Create user in Firebase Console → Authentication")
        elif 'USER_DISABLED' in error_msg:
            print("💡 This user account is disabled")
        elif 'TOO_MANY_ATTEMPTS' in error_msg:
            print("💡 Too many failed attempts")
            print("   Try again later")
    
    sys.exit(1)

except Exception as e:
    print(f"❌ Error: {str(e)}")
    sys.exit(1)
