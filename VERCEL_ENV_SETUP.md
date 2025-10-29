# Vercel Environment Strategy

This project now ships with a streamlined credential loader so you only need a **single** secret for Firebase on Vercel. The goal is to minimise configuration drift and stay well under Vercel’s 100-variable limit.

## ✅ Required variables

| Name | Scope | Why |
| --- | --- | --- |
| `FIREBASE_SERVICE_ACCOUNT` | Serverless functions | JSON (or base64 JSON) for the Firebase Admin SDK. Used by REST, GraphQL, and any Firestore access. |

That’s it for the backend. All other server values are optional.

### Acceptable formats

The loader accepts:

1. Raw JSON copied from your service-account file (including braces), or
2. A base64-encoded version of the same JSON blob.

```bash
# raw JSON (preferred for Vercel dashboard)
{
  "type": "service_account",
  "project_id": "sloane-hub",
  "client_email": "firebase-adminsdk@example.iam.gserviceaccount.com",
  "private_key": "-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"
}

# base64 example
cat serviceAccountKey.json | base64
```

If you paste raw JSON into Vercel, keep the newline escape sequences (`\\n`) for the private key. The loader normalises them automatically.

## ⚙️ Optional variables

| Name | Scope | When to set |
| --- | --- | --- |
| `OPENAI_API_KEY` | Serverless functions | Required only if you plan to use `/api/assistant`. |
| `VITE_API_URL` | Frontend build | Use when you need the UI to call a non-default API URL. Defaults to the deployed domain. |

Everything else (Redis, analytics toggles, JWT HS secrets, etc.) now has sensible defaults and no longer needs to live in Vercel.

## Deployment checklist

1. Open **Project → Settings → Environment Variables** in Vercel.
2. Click **Add New** and create `FIREBASE_SERVICE_ACCOUNT` for **Production**, **Preview**, and **Development**.
   - Paste the raw JSON or base64 string.
3. (Optional) Add `OPENAI_API_KEY` and `VITE_API_URL` if you rely on those features.
4. Redeploy the project so the new secrets propagate.

## Local development tips

- Keep the original `serviceAccountKey.json` file for local runs; the loader still falls back to it when the env variable is missing.
- To mimic the Vercel setup locally, create a `.env.local` file with:

```bash
FIREBASE_SERVICE_ACCOUNT=$(cat serviceAccountKey.json | base64)
```

Then run `source .env.local` (or use a tool like `direnv`).

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| 401s from secured routes | Missing or malformed `FIREBASE_SERVICE_ACCOUNT` | Re-paste the JSON. Ensure each `\\n` in the private key is escaped. |
| Base64 error in logs | Non-base64 string was provided | Paste raw JSON instead of base64, or regenerate the base64 string. |
| GraphQL websocket auth fails | Firebase Admin app was never initialised | Usually the same missing service-account issue. Check Vercel secrets. |

By trimming the env surface to a single secret, redeploys are faster, credentials are easier to audit, and you stay comfortably within Vercel’s env limits.
