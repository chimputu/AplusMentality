# Credential Rotation Guide

**Why:** Real API keys were committed to git history in `.env.example` before the security fix on 2026-10-27. Even though `.env.example` now contains placeholders, the old keys are permanently visible in `git log`. You must rotate **all** of them at their respective services.

---

## ⚠️ Important Order

Rotate credentials **one at a time**, updating `.env.local` and Vercel environment variables after each step, and verify the app still works before moving to the next.

---

## 1. Prisma Data Proxy (Database)

**Old key pattern:** `sk_muRFk09oI2p-d7v4aaLa1`

### Steps

1. Go to [Prisma Data Proxy Dashboard](https://console.prisma.io/data-proxy)
2. Find your project (`AplusMentality` or similar)
3. Click **Regenerate API Key** (or **Rotate Credentials**)
4. Copy the new `DATABASE_URL` connection string
5. Update `.env.local` with the new URL
6. Update Vercel: Go to [Vercel Dashboard](https://vercel.com) → Your Project → Settings → Environment Variables → Edit `DATABASE_URL`
7. Test locally: `npx prisma db push`
8. Deploy to Vercel and verify `/api/health` returns `status: "ok"`

### If you don't use Prisma Data Proxy

If you use your own PostgreSQL database, rotate the database password:

1. Connect to your database provider (Neon, Supabase, Railway, etc.)
2. Reset the database password
3. Update `DATABASE_URL` in `.env.local` and Vercel

---

## 2. Clerk (Authentication)

**Old keys exposed:**
- Publishable key: `pk_test_dG91Y2hlZC1oZWRnZWhvZy00My5jbGVyay5hY2NvdW50cy5kZXYk`
- Secret key: `sk_test_fTrRSwWQS8YgVvinrNYPk1v3sFfGxQznt88ZRlwDeS`
- Webhook secret: `whsec_/BqHhzCJCsTMaG4d/qlTKq1SCrumatmi`

### Steps

1. Go to [Clerk Dashboard → API Keys](https://dashboard.clerk.com/last-active?path=api-keys)
2. Click **Regenerate** next to each key:
   - **Publishable key** → Regenerate
   - **Secret key** → Regenerate
3. After regenerating the secret key, the **webhook secret** will also change
4. Copy all three new values
5. Update `.env.local`:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_NEW_VALUE_HERE
   CLERK_SECRET_KEY=sk_test_NEW_VALUE_HERE
   CLERK_WEBHOOK_SECRET=whsec_NEW_VALUE_HERE
   ```
6. Update Vercel environment variables for all three
7. Verify sign-in/sign-up still works
8. Verify Clerk webhooks still fire (check `/api/webhooks/clerk` logs)

### ⚠️ Warning

Regenerating Clerk keys will **invalidate all existing sessions**. All users will be signed out and need to log in again.

---

## 3. Cloudinary (Media Storage)

**Old keys exposed:**
- Cloud name: `bfo1skot`
- API Key: `351735923413638`
- API Secret: `uHdGt5UMZobEmoxhAmAjzBdfj08`

### Steps

1. Go to [Cloudinary Console](https://cloudinary.com/console)
2. Navigate to **Settings** → **API Keys**
3. Under **API Keys** section, click **Regenerate API Secret**
4. Copy the new API secret
5. Update `.env.local`:
   ```
   CLOUDINARY_API_SECRET=new_secret_here
   ```
6. Update Vercel environment variable `CLOUDINARY_API_SECRET`
7. Test video/image upload functionality

### Note

Cloudinary's cloud name and API key typically don't need rotation — only the secret. The cloud name (`bfo1skot`) is not a secret, it's just an identifier.

---

## 4. Upstash Redis (Caching)

**Old token exposed:** `gQAAAAAAAttYAAIgcDFlNzlkNGZiNWY1NDY0Y2VhODNiZjNmYjQ2ODdhMmZjNg`

### Steps

1. Go to [Upstash Console](https://console.upstash.io/)
2. Select your Redis database (`firm-bear-187224` or similar)
3. Go to **Configuration** → **REST Token**
4. Click **Regenerate Token**
5. Copy the new token
6. Update `.env.local`:
   ```
   UPSTASH_REDIS_REST_TOKEN=new_token_here
   ```
7. Update Vercel environment variable `UPSTASH_REDIS_REST_TOKEN`
8. Test AI chat functionality (uses Redis for caching)

### Note

Regenerating the token will invalidate existing cached data. This is fine — cache will rebuild.

---

## 5. Brevo (Email) — If exposed

Check your git history to see if the Brevo key was exposed:

```bash
git log -p --all -- .env.example | grep "BREVO_API_KEY"
```

If the real key was committed, rotate it:

1. Go to [Brevo Dashboard → API Keys](https://www.brevo.com/account/api-keys)
2. Delete the existing API key
3. Create a new API key
4. Update `.env.local` and Vercel

---

## Post-Rotation Checklist

After rotating all credentials:

- [ ] All `.env.local` values updated with new credentials
- [ ] All Vercel environment variables updated
- [ ] `npx prisma db push` works locally
- [ ] Sign-in/sign-up works (Clerk)
- [ ] Clerk webhooks fire on user creation
- [ ] Video/image upload works (Cloudinary)
- [ ] AI chat works (Upstash Redis)
- [ ] Email sending works (Brevo)
- [ ] `/api/health` returns `status: "ok"`
- [ ] Run tests: `npx vitest run`

---

## Git History Cleanup (Optional but Recommended)

The old keys are permanently in your git history. To remove them:

### Option 1: BFG Repo-Cleaner (Recommended)

```bash
# Install BFG
brew install bfg  # macOS
# or: pip install bfg-repo-cleaner

# Clone a fresh copy
cd ..
git clone --mirror git@github.com:your-org/AplusMentality.git
cd AplusMentality.git

# Remove the old .env.example content
bfg --replace-text <(echo 'your_database_url_here') --replace-text <(echo 'sk_test_your_secret_key_here') .

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push (WARNING: rewrites history)
git push --force
```

### Option 2: Start fresh

If the repo is small and you don't need to preserve history:

```bash
# Create a new repo on GitHub
# Reinitialize git
rm -rf .git
git init
git remote add origin git@github.com:your-org/AplusMentality.git
git add .
git commit -m "Initial commit"
git push -u origin main --force
```

### Option 3: Accept the exposure

If these are all **test/development** keys (Clerk `sk_test_` prefix), the risk is lower. You can simply rotate them and move on without rewriting history.

---

## Risk Assessment

| Service | Key Type | Risk Level | Action |
|---------|----------|------------|--------|
| Prisma Data Proxy | Production DB access | 🔴 Critical | Rotate immediately |
| Clerk | Test keys (`sk_test_`) | 🟡 Medium | Rotate for safety |
| Cloudinary | API secret | 🟠 High | Rotate secret |
| Upstash Redis | REST token | 🟠 High | Rotate token |
| Brevo | API key | 🟡 Medium | Check if exposed, rotate if needed |
