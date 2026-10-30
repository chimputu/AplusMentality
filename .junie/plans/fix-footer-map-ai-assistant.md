---
sessionId: session-261030-113956-113g
---

# Requirements

### Overview
Three issues on the public homepage need fixing:
1. **Footer Links** — verify that footer links (`/privacy-policy`, `/terms-of-service`, `/api/health`) are accessible without login.
2. **World Map** — update the Aceternity world map to connect Zambia to all 7 continents instead of the current 5 cities.
3. **AI Assistant** — fix the floating AI Assistant widget on the public homepage so it works for anonymous (non-logged-in) visitors.

### Functional Requirements

#### Footer Links (Public Access)
- As a visitor, I can click Privacy Policy, Terms of Service, and System Status in the footer without being redirected to the login page.
- The pages `/privacy-policy` and `/terms-of-service` exist and render content (not 404).

#### World Map (Zambia to 7 Continents)
- As a visitor, I see the world map connecting Lusaka, Zambia to cities across all 7 continents: Europe, North America, Asia, South America, Oceania, Antarctica, and Africa.

#### AI Assistant (Guest Mode)
- As a visitor (not logged in), I can click the floating AI Assistant button on the homepage and send messages.
- The AI responds using a landing-page-specific system prompt about A+ Mentality.
- The AI Assistant doesn't crash when there's no user session.

### Out of Scope
- Paid/subscription tiers for the AI.
- Changes to the authenticated dashboard AI Assistant (it already works).
- New footer pages beyond what's referenced by existing links.

# Technical Design

### Current Implementation

**Footer Routes:**
- `proxy.ts` — uses `publicRoutePatterns` array. Already includes `/privacy-policy`, `/terms-of-service`, and `/api/health`.
- `app/privacy-policy/page.tsx` and `app/terms-of-service/page.tsx` exist.
- Both `AppFooter.tsx` and `HomePageClient.tsx` (inline footer, lines 1275-1384) link to these routes.
- **Conclusion:** Footer links are already public. No changes needed unless the user reports specific routes that still redirect.

**World Map:**
- `components/world-map-demo.tsx` — currently has 5 dots from Lusaka to: London, New York, Dubai, Johannesburg, Beijing.
- `components/ui/world-map.tsx` — the underlying WorldMap component accepting `dots` prop.

**AI Assistant:**
- `components/ai/home-ai-assistant.tsx` — the floating widget on the homepage. Calls `POST /api/chat` (line 131). Already handles `isLoggedIn` state gracefully — for guests it skips conversation creation and just sends messages to the API.
- `app/api/chat/route.ts` — already supports anonymous users! Line 263-271: it checks `isSignedIn`, and uses `LANDING_PROMPT` for guests and `APP_PROMPT` for logged-in users. No auth guard blocking anonymous access.
- **Root cause:** `proxy.ts` doesn't include `/api/chat` in `publicRoutePatterns`. The Clerk middleware intercepts the request at line 91-92 and redirects to sign-in before the API route handler even runs.

### Key Decisions

1. **Add `/api/chat` to public routes** — The API already handles guest mode correctly. The only blocker is the proxy middleware. Adding `/api/chat` to `publicRoutePatterns` is sufficient.

2. **No changes needed to the AI Assistant component** — `home-ai-assistant.tsx` already conditionally creates conversations only for logged-in users (line 119-128) and sends messages anonymously otherwise. The component is already guest-ready.

3. **No changes needed to the AI API route** — `app/api/chat/route.ts` already selects `LANDING_PROMPT` for anonymous users (line 271). It doesn't require `userId` to function.

### Proposed Changes

#### 1. proxy.ts — Add `/api/chat` to public routes
- File: `proxy.ts`
- Add `/api/chat` to the `publicRoutePatterns` array (line 5-31).
- This allows anonymous users to call the chat API without being redirected to sign-in.

#### 2. world-map-demo.tsx — Update dots to 7 continents
- File: `components/world-map-demo.tsx`
- Replace the current 5 dots with 7 dots connecting Lusaka to:
  - London (Europe)
  - New York (North America)
  - Beijing (Asia)
  - São Paulo (South America)
  - Sydney (Oceania)
  - Antarctica (Antarctica)
  - Cairo (Africa)

#### 3. Footer — No changes needed
- The footer routes are already public in `proxy.ts` and the pages exist. If the user confirms specific routes still redirect, we'll add them.

# Delivery Steps

### ✓ Step 1: Add /api/chat to public routes in proxy.ts
Fix the AI Assistant on the public homepage by allowing anonymous access to the chat API.
- Open `proxy.ts` and add `/api/chat` to the `publicRoutePatterns` array.
- This is the only change needed — the AI component and API route already handle guest mode correctly.
- Verify that the `/api/chat` route is matched before the Clerk auth check at line 91.

### ✓ Step 2: Update World Map to connect Zambia to all 7 continents
Replace the current 5 connection dots with 7 dots spanning all continents.
- Open `components/world-map-demo.tsx` and update the `dots` array in the `WorldMap` component.
- New destinations: London (Europe), New York (N. America), Beijing (Asia), São Paulo (S. America), Sydney (Oceania), Antarctica, Cairo (Africa).
- All dots originate from Lusaka, Zambia (lat: -15.3875, lng: 28.3228).