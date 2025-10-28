# 🚀 Push to Vercel-Connected Repository (kumii-dev)

## Issue
Vercel deployment reads from: `https://github.com/kumii-dev/marketplace-firebase.git`

Your push fails because you're authenticated as `Khulekani-22`, but need `kumii-dev` credentials.

---

## Solution 1: Personal Access Token (FASTEST)

### Step 1: Create Token for kumii-dev Account

1. **Login to GitHub as kumii-dev**
   - Go to: https://github.com/login
   - Username: `kumii-dev`
   - Password: (your kumii-dev password)

2. **Generate Token**
   - Go to: https://github.com/settings/tokens
   - Click: "Generate new token" → "Generate new token (classic)"
   - Note: "Marketplace Vercel Deploy"
   - Expiration: 90 days (or No expiration)
   - **Check scope:** `repo` (Full control of private repositories)
   - Click: "Generate token"
   - **COPY THE TOKEN** (you won't see it again!)

### Step 2: Push with Token

```bash
cd "/Applications/XAMPP/xamppfiles/htdocs/firebase sloane hub/ui/marketplace-ui-react"

# Replace YOUR_KUMII_TOKEN with actual token
git push https://YOUR_KUMII_TOKEN@github.com/kumii-dev/marketplace-firebase.git main
```

**Example:**
```bash
# If your token is: ghp_abc123xyz789
git push https://ghp_abc123xyz789@github.com/kumii-dev/marketplace-firebase.git main
```

### Step 3: Update Remote (Optional - for future pushes)

Store the token in the remote URL:

```bash
cd "/Applications/XAMPP/xamppfiles/htdocs/firebase sloane hub/ui/marketplace-ui-react"

# Update kumii remote with token
git remote set-url kumii https://YOUR_KUMII_TOKEN@github.com/kumii-dev/marketplace-firebase.git

# Now simple push works
git push kumii main
```

⚠️ **Security Note:** Token is stored in plaintext in `.git/config`. Alternatively, use Git credential helper (see Solution 3).

---

## Solution 2: SSH Keys (MOST SECURE)

### Step 1: Generate SSH Key for kumii-dev

```bash
# Generate key
ssh-keygen -t ed25519 -C "kumii-dev@email.com" -f ~/.ssh/id_ed25519_kumii

# Press Enter for no passphrase (or add one for extra security)
```

### Step 2: Copy Public Key

```bash
cat ~/.ssh/id_ed25519_kumii.pub
```

Copy the entire output (starts with `ssh-ed25519`)

### Step 3: Add Key to kumii-dev GitHub Account

1. Login to GitHub as **kumii-dev**
2. Go to: https://github.com/settings/keys
3. Click: "New SSH key"
4. Title: "MacBook Pro - Marketplace Deploy"
5. Key: (paste the public key)
6. Click: "Add SSH key"

### Step 4: Configure SSH

Create/edit SSH config:

```bash
nano ~/.ssh/config
```

Add this configuration:

```
# kumii-dev account
Host github-kumii
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_kumii
  IdentitiesOnly yes
```

Save and exit (Ctrl+X, Y, Enter)

### Step 5: Update Remote to SSH

```bash
cd "/Applications/XAMPP/xamppfiles/htdocs/firebase sloane hub/ui/marketplace-ui-react"

# Change kumii remote to SSH
git remote set-url kumii git@github-kumii:kumii-dev/marketplace-firebase.git

# Test connection
ssh -T git@github-kumii

# Push
git push kumii main
```

---

## Solution 3: Git Credential Manager (CLEAN)

Use macOS Keychain to store credentials:

```bash
cd "/Applications/XAMPP/xamppfiles/htdocs/firebase sloane hub/ui/marketplace-ui-react"

# Try to push (will prompt for credentials)
git push kumii main

# When prompted:
# Username: kumii-dev
# Password: YOUR_PERSONAL_ACCESS_TOKEN (not GitHub password!)
```

macOS Keychain will save it for future pushes.

---

## Solution 4: Temporarily Switch Remote Origin (QUICK HACK)

If you just need to deploy NOW:

```bash
cd "/Applications/XAMPP/xamppfiles/htdocs/firebase sloane hub/ui/marketplace-ui-react"

# Temporarily make kumii the default remote
git remote rename origin khulekani
git remote rename kumii origin

# Push to kumii (now called origin)
git push https://YOUR_KUMII_TOKEN@github.com/kumii-dev/marketplace-firebase.git main

# Restore names
git remote rename origin kumii
git remote rename khulekani origin
```

---

## Recommended Approach

**For regular deployment to Vercel:**

1. **Generate Personal Access Token** for kumii-dev (Solution 1, Step 1)
2. **Store in remote URL** (Solution 1, Step 3)
3. **Push normally:** `git push kumii main`

This is simplest and works immediately.

**For maximum security:** Use SSH keys (Solution 2)

---

## Quick Deploy Commands

**After getting kumii-dev token:**

```bash
cd "/Applications/XAMPP/xamppfiles/htdocs/firebase sloane hub/ui/marketplace-ui-react"

# Option A: Push with token directly (one-time)
git push https://YOUR_TOKEN@github.com/kumii-dev/marketplace-firebase.git main

# Option B: Update remote and push (future pushes easier)
git remote set-url kumii https://YOUR_TOKEN@github.com/kumii-dev/marketplace-firebase.git
git push kumii main
```

Replace `YOUR_TOKEN` with the actual Personal Access Token from kumii-dev account.

---

## Verify Deployment

After successful push:

1. **Check Vercel Dashboard**: https://vercel.com/dashboard
2. **New deployment triggered** from kumii-dev/marketplace-firebase
3. **Wait 2-3 minutes** for build to complete
4. **Test**: https://marketplace-firebase.vercel.app/dashboard

---

## Current Status

✅ **Commit exists locally** (b750f0dd - GraphQL dependencies)  
✅ **Pushed to Khulekani-22 repo** (backup)  
❌ **NOT pushed to kumii-dev repo** (Vercel source)  
⏳ **Vercel not deployed** (waiting for kumii-dev push)  

**Next Step:** Get kumii-dev token and push!

---

## Troubleshooting

### "Permission denied to Khulekani-22"
You're using wrong credentials. Must authenticate as `kumii-dev`.

### "Support for password authentication was removed"
Use Personal Access Token (not GitHub password) when prompted for password.

### Token doesn't work
- Make sure `repo` scope is checked when creating token
- Token must be from kumii-dev account (not Khulekani-22)
- Use token as password, not GitHub password

### SSH Permission Denied
- Public key must be added to kumii-dev account (not Khulekani-22)
- Check SSH config points to correct key file
- Test: `ssh -T git@github-kumii`

---

## Token Creation Checklist

When creating Personal Access Token:

- [ ] Logged in as **kumii-dev** (not Khulekani-22)
- [ ] Settings → Developer settings → Personal access tokens
- [ ] Generate new token (classic)
- [ ] Scope: **`repo`** checked
- [ ] Generated and **copied token**
- [ ] Token stored securely

---

## Final Deploy Command

```bash
# Get token from kumii-dev account, then:
git push https://YOUR_KUMII_TOKEN@github.com/kumii-dev/marketplace-firebase.git main

# ✅ This triggers Vercel deployment
# ✅ GraphQL fix goes live
# ✅ Dashboard works!
```

🚀 **Once pushed to kumii-dev, Vercel auto-deploys in 2-3 minutes!**
