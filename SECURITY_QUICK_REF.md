# 🚨 SECURITY FIX - QUICK REFERENCE CARD

## ⚡ 5-Minute Quick Start

```bash
# 1. FIRST: Rotate credentials at Firebase Console
#    → https://console.firebase.google.com/project/sloane-hub/settings/general
#    → Delete old key, create new one

# 2. Run automated fix
cd "/Applications/XAMPP/xamppfiles/htdocs/firebase sloane hub/ui/marketplace-ui-react"
./scripts/quick-security-fix.sh

# 3. Clean Git history
brew install bfg
bfg --delete-files serviceAccountKey.json
bfg --delete-files .env
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push origin --force --all

# 4. Test
npm run dev
node backend/server.js
```

---

## 📚 Documentation Map

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **SECURITY_ALERT_SUMMARY.md** | Overview & quick start | Start here |
| **SECURITY_FIX_URGENT.md** | Detailed instructions | Step-by-step guidance |
| **SECURITY_REMEDIATION_CHECKLIST.md** | Complete checklist | Track your progress |
| **THIS FILE** | Quick reference | Quick commands |

---

## 🔑 Credentials to Rotate

| What | Where | Action |
|------|-------|--------|
| **Firebase Web API Key** | [Console](https://console.firebase.google.com/project/sloane-hub/settings/general) | Delete old, create new |
| **Service Account Key** | [IAM Console](https://console.cloud.google.com/iam-admin/serviceaccounts?project=sloane-hub) | Delete ALL, create new |

---

## 🛠️ Scripts Available

```bash
# Automated security fix
./scripts/quick-security-fix.sh

# Scan for remaining issues
./scripts/scan-credentials.sh

# Get Firebase token (after fix)
export FIREBASE_API_KEY="your_new_key"
python3 scripts/get-firebase-token.py email@example.com password
```

---

## ✅ Critical Checklist

- [ ] Rotated Firebase Web API Key
- [ ] Rotated Service Account Key
- [ ] Ran `quick-security-fix.sh`
- [ ] Placed new `serviceAccountKey.json`
- [ ] Cleaned Git history with BFG
- [ ] Force pushed to GitHub
- [ ] Tested application works
- [ ] Verified no credentials in Git: `./scripts/scan-credentials.sh`

---

## 🚫 What NOT to Do

- ❌ Don't push before rotating credentials
- ❌ Don't commit `.env` files
- ❌ Don't commit `serviceAccountKey.json`
- ❌ Don't skip cleaning Git history
- ❌ Don't share credentials in chat/email

---

## ✅ What TO Do

- ✅ Use environment variables for ALL credentials
- ✅ Keep `serviceAccountKey.json` outside Git
- ✅ Add credentials to `.gitignore`
- ✅ Use `.env.example` for templates
- ✅ Set up Git hooks to prevent future leaks

---

## 📁 File Structure (After Fix)

```
your-project/
├── .env                          # ← Your credentials (gitignored)
├── .env.example                  # ← Template (safe to commit)
├── serviceAccountKey.json        # ← New key (gitignored)
├── src/
│   ├── firebase.js               # ← Uses import.meta.env.VITE_FIREBASE_API_KEY
│   └── lib/firebase.ts           # ← Uses import.meta.env.VITE_FIREBASE_API_KEY
├── backend/
│   └── services/firestore.js     # ← Loads from serviceAccountKey.json
└── scripts/
    ├── get-firebase-token.py     # ← Uses os.environ.get('FIREBASE_API_KEY')
    └── *.mjs                      # ← Uses process.env.FIREBASE_API_KEY
```

---

## 🔒 Environment Variables

### Frontend (`.env`):
```bash
VITE_FIREBASE_API_KEY=your_new_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=sloane-hub.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=sloane-hub
```

### Backend:
Place `serviceAccountKey.json` in root directory (it's gitignored)

### Scripts:
```bash
export FIREBASE_API_KEY="your_new_api_key_here"
```

---

## 🆘 Emergency Contacts

| Issue | Contact |
|-------|---------|
| Firebase | https://firebase.google.com/support |
| Google Cloud | https://cloud.google.com/support |
| GitHub Security | security@github.com |
| GitGuardian | https://www.gitguardian.com/ |

---

## ⏱️ Time Budget

- Credential rotation: 15-30 min
- Run scripts: 10-15 min
- Git history clean: 15-20 min
- Testing: 20-30 min
- **Total: ~2 hours**

---

## 🔍 Verification Commands

```bash
# Check no credentials in code
./scripts/scan-credentials.sh

# Check nothing sensitive in Git
git ls-files | grep -E '(\.env|serviceAccountKey)'
# Should return NOTHING

# Check .gitignore
git status
# Should NOT show .env or serviceAccountKey.json

# Test application
npm run dev                    # Frontend should work
node backend/server.js         # Backend should work
curl http://localhost:5055/health/live  # Should return {"status":"alive"}
```

---

## 📞 Get Help

**Stuck?** Read the full guides:
1. **SECURITY_ALERT_SUMMARY.md** - Start here
2. **SECURITY_FIX_URGENT.md** - Detailed steps
3. **SECURITY_REMEDIATION_CHECKLIST.md** - Complete checklist

**Questions?** Check:
- Firebase docs: https://firebase.google.com/docs
- Google Cloud docs: https://cloud.google.com/docs

---

## 🎯 Success Criteria

You're done when:
- ✅ GitGuardian shows no alerts
- ✅ Application works with new credentials
- ✅ `./scripts/scan-credentials.sh` finds no issues
- ✅ Git history is clean
- ✅ All files use environment variables

---

**⚠️ REMEMBER**: Rotate credentials FIRST, then clean history, then force push.

**Never commit credentials to Git again!**
