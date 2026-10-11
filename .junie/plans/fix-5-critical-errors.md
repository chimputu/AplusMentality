# Requirements

### Overview
Fix 5 critical errors identified from analyzing 147 Vercel logs for the A+ Mentality production app.

### Key Deliverables
- Fix banners API Prisma query error (Unknown argument 'or')
- Fix tutor application Zod validation errors
- Fix "Conversation not found" Server Component render errors
- Strengthen AI hallucination prevention
- Update SSL mode in DATABASE_URL

# Technical Design

### Error 1 — Banners API Prisma Query
**File:** `app/api/banners/active/route.ts`
**Problem:** Uses `endsAt: { or: [...] }` which Prisma doesn't accept. Must use `OR` at the top level.
**Fix:** Restructure the where clause using `AND` containing `OR` arrays properly.

### Error 2 — Tutor Application Zod Validation
**File:** `lib/validations/tutor-application.ts`
**Problem:** `description` in offeringSchema requires min 20 chars, but users submit empty/short values.
**Fix:** Make `description` optional with `.optional().or(z.literal(''))`.

### Error 3 — Conversation Not Found
**File:** `lib/actions/chat.ts`, `components/ai/ai-assistant.tsx`
**Problem:** `getConversation()` throws when conversation ID is stale/deleted.
**Fix:** Return `null` instead of throwing; clear stale localStorage ID and create fresh conversation.

### Error 4 — AI Hallucination
**File:** `lib/ai/platform-facts.ts`, `lib/ai/prompts/public.ts`
**Problem:** AI still mentions MIT despite filters catching it.
**Fix:** Add more explicit examples of wrong answers to the system prompt.

### Error 5 — SSL Mode Deprecation
**File:** `.env.local`, Vercel env vars
**Problem:** `sslmode=require` is deprecated.
**Fix:** Update to `sslmode=verify-full` in .env.local (Vercel env var noted for manual update).

# Testing

### Validation Approach
1. **Banners API**: Test the Prisma where clause compiles and returns results
2. **Tutor Application**: Verify schema accepts empty/short optional fields
3. **Conversation**: Delete a conversation, reload page — should create fresh one
4. **AI Hallucination**: Check prompt includes explicit wrong answer examples
5. **SSL Mode**: Verify .env.local uses `sslmode=verify-full`

# Delivery Steps

### ✓ Step 1: Fix banners API Prisma query error
Rewrite `app/api/banners/active/route.ts` where clause to use proper Prisma AND/OR structure instead of `or` inside field.

### ✓ Step 2: Fix tutor application Zod validation errors
Make `description` in offeringSchema optional in `lib/validations/tutor-application.ts` so empty/short descriptions don't crash submission.

### ✓ Step 3: Fix "Conversation not found" Server Component errors
Update `lib/actions/chat.ts` `getConversation()` to return null instead of throwing. Update `components/ai/ai-assistant.tsx` to handle stale conversation IDs by clearing localStorage and creating fresh conversations.

### ✓ Step 4: Strengthen AI hallucination prevention
Add explicit wrong answer examples to `lib/ai/prompts/public.ts` system prompt and add more forbidden university names to `lib/ai/platform-facts.ts`.

### ✓ Step 5: Update SSL mode in DATABASE_URL
Update `.env.local` DATABASE_URL from `sslmode=require` to `sslmode=verify-full`. Note that Vercel env var also needs manual update.
