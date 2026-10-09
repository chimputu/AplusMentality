---
sessionId: session-261009-141646-1e26
---

# Current State & Problem

### Current State

**Files investigated:**
- `lib/ai/prompts/public.ts` — 144 lines. Contains tone, formatting, and behavioral rules but **zero factual grounding** about A+ Mentality being Zambia-based. No mention of supported institutions, country, or forbidden claims.
- `lib/ai/prompts/logged-in.ts` — 69 lines. Same issue — personalization templates only, no factual constraints.
- `lib/ai/prompts.ts` — 128 lines. Legacy prompt builder (not used by the current route). Contains generic prompts without factual grounding.
- `app/api/ai/chat/route.ts` — 133 lines. Unified chat endpoint. Selects prompt based on mode (PUBLIC/LOGGED_IN), passes it to `chatWithAI()`, and returns the raw response. **No facts injection, no response validation.**
- `lib/ai/openrouter.ts` — 41 lines. Calls OpenRouter API with the system prompt and messages.
- `lib/ai/context.ts` — 43 lines. Determines PUBLIC vs LOGGED_IN mode and fetches user context.
- `sentry.server.config.ts` — Sentry is configured for server-side error capture.

**Missing files:**
- `lib/ai/platform-facts.ts` — Does NOT exist
- `lib/ai/validate-response.ts` — Does NOT exist

### Root Cause
The AI has no factual constraints in its system prompt. It receives formatting and tone instructions but nothing that says "A+ Mentality is Zambia-based" or "only support these 12 institutions." The model fills the gap with hallucinated data from its training corpus.

### Problem
When asked "Which universities are supported?", the AI invents 150+ universities across US/UK/CA/AU because:
1. No facts are injected into the system prompt
2. No post-processing catches forbidden claims
3. No examples of correct vs incorrect responses exist in the prompt


# Technical Design

### Solution Architecture

Three-layer defense against hallucinations:

```
mermaid
graph LR
    A[User Message] --> B[route.ts]
    B --> C[buildFactsBlock]
    C --> D[PLATFORM_FACTS]
    D --> E[System Prompt with Facts]
    E --> F[OpenRouter AI]
    F --> G[Raw Response]
    G --> H[validateAIResponse]
    H --> I{Contains forbidden claims?}
    I -->|Yes| J[Safe fallback + Sentry alert]
    I -->|No| K[Return response]
```

### Layer 1: Hard-coded Facts (`lib/ai/platform-facts.ts`)
New file with `PLATFORM_FACTS` constant containing:
- Identity: name, country (Zambia), tagline, scope
- Numbers: 12 institutions, 500+ users, 200+ courses
- Complete institution list (12 Zambian institutions with short names and cities)
- Features that exist (courses, materials, past papers, etc.)
- Features that do NOT exist yet (assessments, badges, certificates, integrations, etc.)
- Pricing model
- Forbidden claims array (30+ strings the AI must never say)

### Layer 2: Strict System Prompt (update `public.ts` and `logged-in.ts`)
Prepend to both prompts:
1. **Absolute rules block** — 7 non-negotiable rules (Zambia only, no foreign universities, no invented numbers, etc.)
2. **Examples block** — 5 pairs of correct vs incorrect responses
3. Facts block injected dynamically at request time (from `buildFactsBlock()`)

### Layer 3: Post-processing Filter (`lib/ai/validate-response.ts`)
New file with `validateAIResponse()` function:
- Scans response text against `forbiddenClaims` array
- Checks for forbidden university names (Oxford, Cambridge, Harvard, MIT, etc.)
- If violation found: returns safe fallback message, logs to console and Sentry
- Returns `{ text, wasFiltered }` tuple

### Changes to `app/api/ai/chat/route.ts`
1. Import `PLATFORM_FACTS` and `validateAIResponse`
2. Add `buildFactsBlock()` helper function
3. Prepend facts block to system prompt: `const systemPrompt = \`${factsBlock}\n\n${basePrompt}\``
4. After getting AI response: validate with `validateAIResponse(content)`
5. If filtered: log to Sentry with `Sentry.captureMessage()`
6. Return validated content

### Key Design Decisions
- **Facts are hard-coded** (not from DB) — guarantees they're never empty or stale
- **Three layers** — prompt alone isn't enough; post-processing catches what the prompt misses
- **Sentry logging** — filtered responses are tracked so we can measure if the prompt needs strengthening
- **Safe fallback** — instead of showing hallucinated content, redirect to support email
- **Both prompts updated** — public and logged-in modes both get the same factual constraints


# Delivery Steps

### * Step 1: Create platform-facts.ts with hard-coded ground truth
Create `lib/ai/platform-facts.ts` with the `PLATFORM_FACTS` constant containing all factual data about A+ Mentality.
- Export `PLATFORM_FACTS` object with identity, scope, numbers, institution list (12 Zambian institutions), features, non-features, pricing, and forbidden claims array
- Hard-code everything — no database fetches, no dynamic data
- This is the single source of truth for all factual AI responses

###   Step 2: Create validate-response.ts post-processing filter
Create `lib/ai/validate-response.ts` with `validateAIResponse()` function.
- Scan response text against `PLATFORM_FACTS.forbiddenClaims` array
- Check for additional forbidden university names (Oxford, Cambridge, Harvard, MIT, Stanford, Yale, Princeton, UCLA, NYU, Toronto, McGill, Melbourne, ANU, UNSW, Imperial)
- Return `{ text, wasFiltered }` — if violations found, return safe fallback message
- Log violations to console with `console.error()`

###   Step 3: Update system prompts with strict rules and examples
Update both prompt files to prepend factual constraints.
- `lib/ai/prompts/public.ts`: Prepend the absolute rules block (7 non-negotiable rules) and the examples block (5 correct vs incorrect pairs) before the existing content
- `lib/ai/prompts/logged-in.ts`: Prepend the same absolute rules and examples block before the existing content
- Both prompts will receive the dynamic facts block at request time (injected in route.ts)

###   Step 4: Update chat route to inject facts and validate responses
Update `app/api/ai/chat/route.ts` to wire everything together.
- Import `PLATFORM_FACTS` from `@/lib/ai/platform-facts` and `validateAIResponse` from `@/lib/ai/validate-response`
- Add `buildFactsBlock()` helper that formats `PLATFORM_FACTS` into a markdown facts block
- Prepend facts block to the system prompt before sending to AI: `const systemPrompt = \`${factsBlock}\n\n${basePrompt}\``
- After receiving AI response, validate with `validateAIResponse(content)`
- If `wasFiltered` is true, log to Sentry using `Sentry.captureMessage()` with warning level
- Return validated content in the JSON response
- Import Sentry from `@sentry/nextjs`

###   Step 5: Verify the fix with test prompts
Test all 8 critical prompts to verify the fix works:
1. "Which universities are supported?" — should list only 12 Zambian institutions
2. "Do you support Oxford University?" — should say no, Zambia only
3. "How many universities do you have?" — should say 12
4. "Do you integrate with Canvas?" — should say no integrations
5. "Are you open-source?" — should redirect to support
6. "Is it free forever?" — should explain institution subscription model
7. "Which UK universities?" — should say we don't support UK universities
8. "What about badges?" — should say badges don't exist

Verify: zero forbidden claims in any response, Sentry logs filtered responses if any slip through.