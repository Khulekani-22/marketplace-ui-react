# 🔥 Vercel Firebase Connection Setup Guide

## Problem
Your app works locally but doesn't connect to Firebase on Vercel because the serverless functions need Firebase Admin SDK credentials.

## Solution: Two Options

### Option 1: Environment Variables (Recommended for Security) ✅

Set up Firebase credentials as Vercel environment variables:

#### Step 1: Get Your Credentials
From your `api/serviceAccountKey.json` file, you need:
- `private_key`
- `client_email`
- `project_id`

#### Step 2: Add to Vercel Dashboard

Go to your Vercel project → Settings → Environment Variables

Add these **three** environment variables:

**1. FIREBASE_PRIVATE_KEY**
```
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCnFw8kfy1zdJ70
R1KzJcEaPEJJqOssFufLlRAOh5azVtvVpp7nBYH8cfrCYJOCoZIh2rzKzxBQ4OuT
9kiZn/leeibdsnpXIuGt48rr4Czm18hqQmc9gkUQDNqRpZAdXlPTgcW/XOf5SjgT
nQieTwknN/fRyQCgj58quL6B+t4UxEMWHhvwGZVpjI0OWj1B91oS9DLS/lZMi+3r
5tMkD7brDR0JMc1E8efNX7a24wvHsFSe+6imHVWfF/0NJDEOGjO1zbOazY6QZKUo
3GjfQoDOWjrRT3t0cOshEFy43I60Iu8z74xYE1Y8A0au7lAidTQOh4D93drLjL1d
pW6KhcFjAgMBAAECggEAPdTuqZbWfu8dE1CBbgH+n3LFJPT5cetYA6I5uua6AcuW
tk1eaCdFnuGe5edPLvwTU6vaSUKuyv8wriRpYVAtu6SAVXICi9RAp1SwdvESLKqV
Y50HD1/xpqrbByK5XeTWKGLRhqsevMWWUsu9sLeWr4iqkFtNfB0pzWloNjlbjVsp
Webr2rJfD7wp2n5IgQiLNF7BNOtICf3/iodM6gxG3m/5an4tJa95VO6WkAAoKCNM
riwdE+INZhWLNRrel1Jbu0hD+XTiVtXubZgiIQk3Hla/Fvicw8gQSaWoSyGB6mXN
4060+vff1EYV1SH99SrhpoAMLSoHfbtWYLKAZlE4gQKBgQDnpvOW12UasmVbA2F8
EEHOLBUn3OcyhCYRAdSsUiM6p2OcUe3dNSZQ+3idh1GsW94LVWe0jGjTgU0uJan
QbS13x3b9c6JoxAENvwqAam0fGZn762KezfjB6bhfy26Cfg2xrtha7pfUyDv0NVi
In/QMqcZD4EcFtFA6/bGwbbjEwKBgQC4pvCymJ5AVzALrRDKUlY0Jujk4EW4vHmh
JT8PG1InUB+Wa8DLarrPZe+IhO87RFMimoMretaysfyvpNb3xF0u/YhJdd2qO/1h
yKOS1eB937f6bS8N7z/UMFGazM/sOfCz2s8qnCgKVLPJeEx+dGbQfCNtqSKN5fok
9PzMmDEicQKBgGYibt2/xBz8MMHrAK0xgcIEI69NyiyDzsNDozLrZUB0JNlryqHx
Sdb1Y0nop8nGa45B9rEanbYRrSvsgsflqWZSpBiaDOEUWvhwwcdHimpAOupye0JG
R4K6mfJsH14aDS0he/ZdCAQFY804dwxYh5/k5VWgR116FfKY1uoU+KyvAoGAZvx0
8qc8XBZErb5wxub1PVEWQ9DyEf7Mt5vWd859G4AMnhCrDskQN+xalIHQC/Ynh/01
e2KfrDqo/C2r17SlZDfzc0VRxEiBIbCNyq+O7aWBLyMGQ3dU2ju4x+XDcbU/EpDP
SqydiGWFgLCfuUeisFUMTXUv2IST51jcRh/8B4ECgYEAwyW3u3SH8HS9uxf6jY0n
54ZKdutr2UxbrEHj6DdMc3DzcTW3jSY65miqAmQMGc8Usz+JF9ps1EVQDYuvl3V4
l9/HIt1HNWfJE4cFud/Q/rwm90uBZgtn0DWRFwH5SmjdlYPqvSRq66bydHu98+1X
d6jgsKkSTd3gBlOWmT3UVdo=
-----END PRIVATE KEY-----
```
⚠️ **Important**: Copy the ENTIRE private key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` lines

**2. FIREBASE_CLIENT_EMAIL**
```
firebase-adminsdk-fbsvc@sloane-hub.iam.gserviceaccount.com
```

**3. FIREBASE_PROJECT_ID**
```
sloane-hub
```

#### Step 3: Set Environment Scope
For each variable, select:
- ✅ Production
- ✅ Preview
- ✅ Development

#### Step 4: Redeploy
After adding the variables, trigger a new deployment:
```bash
vercel --prod
```

Or push a commit to trigger automatic deployment.

---

### Option 2: Include Service Account File (Less Secure)

If you prefer to include the service account file directly:

#### Step 1: Verify File Exists
Make sure `api/serviceAccountKey.json` exists in your repo.

✅ **Already exists**: `/api/serviceAccountKey.json`

#### Step 2: Update .gitignore (Security Warning!)
If you want to commit the service account (NOT recommended for public repos):

**Remove** this line from `.gitignore`:
```
serviceAccountKey.json
```

⚠️ **Security Risk**: This exposes your Firebase credentials in git history. Only do this for private repositories.

#### Step 3: Commit and Deploy
```bash
git add api/serviceAccountKey.json
git commit -m "Add service account for Vercel"
git push
```

---

## How It Works

Your `api/index.js` already has the correct credential loading logic:

```javascript
function loadServiceAccount() {
  // 1. First, try environment variables (Vercel recommended)
  const envClientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const envPrivateKey = process.env.FIREBASE_PRIVATE_KEY;
  const envProjectId = process.env.FIREBASE_PROJECT_ID;
  
  if (envClientEmail && envPrivateKey) {
    return { client_email: envClientEmail, private_key: envPrivateKey, project_id: envProjectId };
  }
  
  // 2. Fall back to file (if included in deployment)
  const candidatePaths = [
    path.join(__dirname, "serviceAccountKey.json"),
    // ... other paths
  ];
  
  for (const filePath of candidatePaths) {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf8"));
    }
  }
  
  return null; // No credentials found
}
```

---

## Verification Steps

### 1. Check Vercel Logs
After deployment, check the function logs in Vercel dashboard:
- Look for "✅ Firebase Admin initialized"
- Check for any "service account credentials not configured" errors

### 2. Test API Endpoint
Visit: `https://your-app.vercel.app/api/health`

Should return:
```json
{
  "status": "ok",
  "timestamp": "...",
  "firestore": "connected"
}
```

### 3. Test Frontend
- Login to your app
- Try to book a session
- Check browser console for errors

---

## Troubleshooting

### Error: "service account credentials not configured"
**Solution**: Environment variables not set correctly in Vercel
- Double-check variable names (exact match required)
- Verify all 3 variables are set
- Redeploy after adding variables

### Error: "Invalid private key"
**Solution**: Private key format issue
- Make sure to include the BEGIN/END lines
- Check for extra spaces or line breaks
- Private key should be one long string with `\n` for line breaks in Vercel env vars

### Error: "CORS error" or "Network Error"
**Solution**: Check CORS configuration
- Verify your Vercel URL is in the CORS origins list
- Check `api/index.js` CORS configuration

### Still not working?
1. Check Vercel function logs for detailed errors
2. Verify Firebase project ID matches your Firestore project
3. Ensure service account has Firestore permissions

---

## Quick Command Reference

```bash
# Deploy to Vercel
vercel --prod

# Check deployment logs
vercel logs

# Test API locally
npm run backend
curl http://localhost:5055/api/health

# Test API on Vercel
curl https://your-app.vercel.app/api/health
```

---

## Recommended: Option 1 (Environment Variables) ✅

**Pros:**
- ✅ More secure (not in git history)
- ✅ Easy to rotate credentials
- ✅ Different credentials per environment
- ✅ No risk of accidental exposure

**Cons:**
- ⚠️ Requires manual setup in Vercel dashboard
- ⚠️ Need to set variables for each project/environment

Choose Option 1 for production apps! 🚀
