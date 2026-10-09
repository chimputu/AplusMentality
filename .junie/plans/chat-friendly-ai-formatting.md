---
sessionId: session-261009-111027-sqi2
---

# Requirements

### Overview & Goals
The AI assistant currently produces responses with markdown headers (`##`, `###`) and separator lines (`---`, `━━━`) that render as raw text in the chat UI, looking robotic and ugly. The goal is to reformat the AI's output to be clean, natural, and chat-friendly — like ChatGPT or Claude — using bold for headings, proper lists, and emojis as visual anchors.

### Scope

**In Scope:**
- Update `lib/ai/prompts/public.ts` — replace the STYLE section with chat-friendly FORMAT RULES
- Update `lib/ai/prompts/logged-in.ts` — apply the same FORMAT RULES
- Update `components/ai/ai-assistant.tsx` — integrate `react-markdown` (already installed) to render bold, lists, and line breaks properly
- Configure the markdown renderer to gracefully handle any accidental `##` or `###` by rendering them as bold

**Out of Scope:**
- Installing new dependencies (`react-markdown` and `remark-gfm` are already in `package.json`)
- Changing the greeting message (it's already clean)
- Modifying the API route or AI context logic
- Adding new tests (no existing tests cover these files)

### Functional Requirements
1. AI must NEVER output `##` or `###` in responses
2. AI must NEVER output `---` or `━━━` separator lines
3. AI must use `**bold**` for headings and emphasis
4. AI must use numbered lists for ordered items, bullets for unordered
5. AI must use ALL CAPS sparingly (max 1 per response)
6. AI must keep paragraphs to 3 lines max, responses under 400 words
7. AI must end responses with follow-up questions ("Want to know more?")
8. Chat UI must render bold, italic, numbered lists, bullets, and line breaks correctly
9. If the AI accidentally uses `##` or `###`, the renderer should display them as bold (graceful fallback)

# Technical Design

### Current Implementation

**Prompt files:**
- `lib/ai/prompts/public.ts` (74 lines) — The STYLE section (lines 32-50) instructs the AI to use `## Header`, `### Section`, and `---` separators
- `lib/ai/prompts/logged-in.ts` (57 lines) — The STYLE section (lines 31-45) references the same structure as public mode with `##`, `---`, and `###`

**Chat component:**
- `components/ai/ai-assistant.tsx` (444 lines) — Line 365 renders message content as plain text: `{m.content}`. No markdown processing.

**Dependencies:**
- `react-markdown` v10.1.0 and `remark-gfm` v4.0.1 are already installed but unused in the chat component.

**API route:**
- `app/api/ai/chat/route.ts` — imports both prompts, selects based on mode, and passes to the AI. No changes needed.

### Proposed Changes

**1. `lib/ai/prompts/public.ts`**
- Replace the entire STYLE section (lines 32-50) with the new FORMAT RULES
- Replace the "WHEN THE USER ASKS SOMETHING PERSONAL" section (lines 52-70) to use the new format (no `##`, `###`, or `---`)
- Keep CONTEXT, WHAT YOU CAN DO, WHAT YOU CANNOT DO, and TONE sections unchanged
- Update brevity to match new guidelines (100-250 words typical, never exceed 300)

**2. `lib/ai/prompts/logged-in.ts`**
- Replace the STYLE section (lines 31-45) with a reference to the same FORMAT RULES as public mode
- Keep CONTEXT, WHAT YOU CAN DO, WHAT YOU CANNOT DO, TONE, PERSONALIZATION RULES, and SUGGESTED CTA BY ROLE unchanged
- Update brevity (100-350 words typical, never exceed 400)

**3. `components/ai/ai-assistant.tsx`**
- Import `ReactMarkdown` and `remarkGfm` (already available as dependencies)
- Replace `{m.content}` on line 365 with a `<ReactMarkdown>` component
- Configure the renderer to:
  - Render `h1`-`h4` as `<strong>` (graceful fallback for accidental headers)
  - Style `<ul>` with `list-disc pl-5 space-y-1`
  - Style `<ol>` with `list-decimal pl-5 space-y-1`
  - Style `<p>` with `mb-2`
  - Render `<strong>` with proper font weight
- Apply the renderer only to assistant messages (user messages remain plain text)

### File Structure

```
Modified files:
  lib/ai/prompts/public.ts       — replace STYLE + personal redirect sections
  lib/ai/prompts/logged-in.ts    — replace STYLE section
  components/ai/ai-assistant.tsx — add react-markdown rendering
No new files needed.
No dependency changes needed.
```

### Key Decisions
- **Use existing `react-markdown`** — no need to install anything new
- **Render headers as bold** — even though the AI is instructed not to use `##`/`###`, the renderer handles them gracefully to avoid broken UI if the AI slips up
- **Only render markdown for assistant messages** — user messages are plain text input, no need to process them
- **Keep `remark-gfm`** — enables proper bullet/list parsing including task lists and strikethrough

# Delivery Steps

### ✓ Step 1: Update prompt format rules in public.ts
Replace the STYLE section and personal-redirect section in `lib/ai/prompts/public.ts` with chat-friendly FORMAT RULES.
- Replace lines 32-50 (STYLE section) with the new FORMAT RULES: bold for headings, numbered/bullet lists, no hashtags, no separators, emoji anchors, paragraph limits, length caps, and structure templates (greeting, explanation, steps, comparisons, unknown answers).
- Replace lines 52-70 (WHEN THE USER ASKS SOMETHING PERSONAL) to use the new format — no `##`, `###`, or `---`.
- Keep all other sections (CONTEXT, WHAT YOU CAN DO, WHAT YOU CANNOT DO, TONE, HANDOFF CTA) unchanged.

### ✓ Step 2: Update prompt format rules in logged-in.ts
Replace the STYLE section in `lib/ai/prompts/logged-in.ts` with the same chat-friendly FORMAT RULES.
- Replace lines 31-45 (STYLE section) to reference identical formatting rules as public mode.
- Keep all other sections (CONTEXT, WHAT YOU CAN DO, WHAT YOU CANNOT DO, TONE, PERSONALIZATION RULES, SUGGESTED CTA BY ROLE) unchanged.
- The only difference from public mode remains CONTENT (user name, institution), not formatting.

### ✓ Step 3: Integrate react-markdown rendering in ai-assistant.tsx
Update `components/ai/ai-assistant.tsx` to render assistant messages with markdown instead of plain text.
- Add imports: `ReactMarkdown` from `react-markdown` and `remarkGfm` from `remark-gfm`.
- Replace `{m.content}` on line 365 with `<ReactMarkdown>` for assistant messages only (user messages stay plain text).
- Configure component overrides: h1-h4 render as `<strong>`, ul uses `list-disc pl-5 space-y-1`, ol uses `list-decimal pl-5 space-y-1`, p uses `mb-2`.
- Ensure the renderer handles line breaks and spacing correctly for chat-friendly output.