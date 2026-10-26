---
sessionId: session-261026-141415-c04h
---

# Performance Sprint (Completed)

### ✓ Overview & Goals
This sprint focused on build optimization, asset handling, and caching — **without changing any business logic or UI layouts**.

### ✓ Completed Changes
1. **Prisma schema fixed** — Added `newProgramme` relation to `InstitutionChangeRequest` model + reverse `changeRequests` on `Programme`.
2. **Bundle optimized** — Added `framer-motion` to `optimizePackageImports` in `next.config.ts`.
3. **Image optimization verified** — Already using `<Image />` with `priority` on hero, no raw `<img>` tags.
4. **Font optimization verified** — Already using `next/font/google` with `Inter`.
5. **Static caching verified** — No `force-dynamic` on public pages.

---

# Invite Admin Feature

### Overview & Goals
As the Super Admin, I want to generate an invitation link for a specific institution and either send it via Clerk's built-in email or copy it to share via WhatsApp.

### Scope

**In Scope:**
1. Add an "Invite Admin" action button in the institutions table dropdown menu
2. A modal asking for the Admin's email address (optional — leave blank for copyable link only)
3. A Server Action that creates a Clerk organization invitation (auto-creating the Clerk org if missing)
4. Copy-to-clipboard functionality for the invitation link

**Out of Scope:**
- WhatsApp integration (the user copies the link and shares manually)
- Bulk invitations
- Invitation tracking/history

### User Stories
- As a Super Admin, I want to invite an admin for a specific institution by email so they can join with admin rights.
- As a Super Admin, I want to generate a copyable invitation link so I can share it via WhatsApp or other channels.

### Functional Requirements
1. The "Invite Admin" button appears in the actions dropdown menu for each institution row.
2. Clicking the button opens a modal with an email input field and a note: "Leave blank to just generate a copyable link".
3. If an email is provided, Clerk sends an invitation email automatically.
4. If no email is provided, only the invitation link is generated and shown for copying.
5. If the institution has no Clerk organization, one is auto-created using the institution's name and slug.
6. After successful invitation, a success toast is shown with the invitation link and a "Copy Link" button.

### Non-Functional Requirements
- The server action must guard against non-admin users (reuse `requireAdmin()` pattern).
- Clerk API errors should be caught and shown as user-friendly toast messages.
- The modal should match the existing inline modal pattern (fixed overlay div) used in the delete confirmation dialog.

# Technical Design

### Current Implementation

**Institutions Table** (`app/(dashboard)/admin/institutions/_components/institution-table.tsx`):
- Client component rendering a table of institutions with a dropdown menu (View, Edit, Verify, Activate, Delete).
- The dropdown uses `createPortal` to render outside the overflow container.
- Actions use Server Actions from `@/lib/actions/institution-crud` with `useTransition` for pending state.
- Delete confirmation uses an inline modal (fixed overlay div).

**Clerk Organization Utilities** (`lib/clerk-org.ts`):
- `createClerkOrg(name, slug)` — creates a Clerk org via `POST https://api.clerk.com/v1/organizations`.
- Uses `CLERK_SECRET_KEY` env var for authorization.
- Returns `{ success, orgId?, alreadyExists?, error? }`.

**Server Action Pattern** (`lib/actions/user-admin.ts`):
- `'use server'` directive at the top.
- `requireAdmin()` helper checks auth and role.
- Uses `clerkClient()` from `@clerk/nextjs/server` for Clerk operations.
- Returns structured results; errors are thrown as exceptions.

**Institution Model** (`prisma/schema.prisma`):
- Has `clerkOrgId` (String?, unique) and `clerkOrgSlug` (String?) fields.
- The `listInstitutions` query does **not** currently return `clerkOrgId`.

### Key Decisions

1. **Auto-create Clerk org if missing**: When the user clicks "Invite Admin", if the institution has no `clerkOrgId`, the server action will call `createClerkOrg(institution.name, institution.slug)` first, then update the institution record with the new `clerkOrgId`.

2. **Use Clerk invitations API (not membership API)**: The task specifies using `createOrganizationInvitation` which sends an email invitation. This is different from adding an existing user as a member. The invitation flow allows the recipient to sign up and join.

3. **Server Action in `lib/actions/institution-crud.ts`**: Adding the `inviteAdmin` action alongside existing institution CRUD actions keeps related functionality together.

4. **Modal inline in the table component**: Following the existing pattern (delete confirmation modal), the invite modal will be added directly in `institution-table.tsx` rather than as a separate component.

### Proposed Changes

#### 1. Update `listInstitutions` to include `clerkOrgId`
In `lib/actions/institution-crud.ts`, the `listInstitutions` function already returns raw institution objects. The `clerkOrgId` field is part of the Institution model, so it will be included automatically. However, the `InstitutionRow` interface in `institution-table.tsx` needs to be updated to include `clerkOrgId`.

#### 2. Create `inviteAdmin` Server Action
In `lib/actions/institution-crud.ts`, add:

```typescript
export async function inviteAdmin(institutionId: string, emailAddress?: string) {
  await requireAdmin();

  const institution = await prisma.institution.findUnique({ where: { id: institutionId } });
  if (!institution) throw new Error('Institution not found');

  // Auto-create Clerk org if missing
  let orgId = institution.clerkOrgId;
  if (!orgId) {
    const result = await createClerkOrg(institution.name, institution.slug);
    if (!result.success) throw new Error(`Failed to create organization: ${result.error}`);
    if (result.orgId) {
      orgId = result.orgId;
      await prisma.institution.update({
        where: { id: institutionId },
        data: { clerkOrgId: orgId, clerkOrgSlug: institution.slug },
      });
    }
  }

  if (!orgId) throw new Error('No Clerk organization available for this institution');

  // Create invitation via Clerk API
  const redirectUrl = 'https://aplusmentality.vercel.app/admin';
  
  // If email is provided, use Clerk invitation API (sends email)
  if (emailAddress) {
    const response = await fetch(`https://api.clerk.com/v1/organizations/${orgId}/invitations`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email_address: emailAddress,
        role: 'org:admin',
        redirect_url: redirectUrl,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to send invitation: ${errorText}`);
    }

    const data = await response.json();
    return { success: true, invitationUrl: data.url, emailSent: true };
  }

  // No email — generate a public invitation link
  // Clerk doesn't have a "link-only" invitation endpoint, so we create
  // a sign-up link with the org slug pre-filled
  return {
    success: true,
    invitationUrl: `https://aplusmentality.vercel.app/sign-up?org_slug=${institution.slug}`,
    emailSent: false,
  };
}
```

#### 3. Add "Invite Admin" to the dropdown menu
In `institution-table.tsx`, add a new menu item in the portal dropdown (before the Delete button):

```
<UserPlus className="w-4 h-4" />
Invite Admin
```

#### 4. Add Invite Admin Modal
Following the delete confirmation modal pattern, add:
- State: `inviteModalOpen` (institution id | null), `inviteEmail` (string), `inviteResult` ({ url, emailSent } | null)
- Modal with email input, "Send Invitation" and "Generate Link Only" buttons
- Success state showing the invitation URL with a "Copy Link" button

### File Structure

| File | Action |
|------|--------|
| `lib/actions/institution-crud.ts` | Modify — add `inviteAdmin` server action |
| `app/(dashboard)/admin/institutions/_components/institution-table.tsx` | Modify — add menu item, modal, and handlers |

### Architecture Diagram

``` mermaid
graph LR
  A[Institution Table] -->|click Invite Admin| B[Invite Modal]
  B -->|submit email| C[inviteAdmin Server Action]
  B -->|generate link only| C
  C -->|no org?| D[createClerkOrg]
  D -->|org created| E[Update Institution.clerkOrgId]
  C -->|with email| F[Clerk API: create invitation]
  C -->|no email| G[Generate sign-up link with org_slug]
  F -->|invitation URL| B
  G -->|sign-up URL| B
  B -->|copy link| H[Clipboard]
```

### Risks
- **Clerk API rate limits**: Creating orgs and invitations hits Clerk API rate limits. Unlikely to be an issue for admin use but worth monitoring.
- **Slug conflicts**: If an institution slug conflicts with an existing Clerk org slug, `createClerkOrg` returns a 409. The existing `createClerkOrg` function handles this gracefully.
- **No-email flow**: Clerk doesn't have a "generate link only" invitation API. The fallback is a sign-up URL with `org_slug` query parameter, which requires the user to manually join the org after sign-up. This is a known limitation.

# Delivery Steps

### ✓ Step 1: Create the `inviteAdmin` Server Action
Add the server action to `lib/actions/institution-crud.ts` that handles Clerk org auto-creation and invitation.
- Add `inviteAdmin(institutionId, emailAddress?)` function with `requireAdmin()` guard.
- Auto-create Clerk org if the institution has no `clerkOrgId` (using existing `createClerkOrg` from `lib/clerk-org.ts`).
- If email is provided, call Clerk API `POST /v1/organizations/{orgId}/invitations` to send an email invitation.
- If no email, return a sign-up URL with `org_slug` query parameter.
- Update the institution record with `clerkOrgId` if a new org was created.

### ✓ Step 2: Add "Invite Admin" UI to the Institutions Table
Add the modal and menu item to `institution-table.tsx`.
- Update the `InstitutionRow` interface to include `clerkOrgId`.
- Add "Invite Admin" menu item in the dropdown portal (import `UserPlus` from lucide-react).
- Add modal state: `inviteModalId`, `inviteEmail`, `inviteResult`, `invitePending`.
- Implement the invite modal with email input, submit button, and "Generate Link Only" option.
- Show success state with invitation URL and "Copy Link" button.
- Call the `inviteAdmin` server action on submit.