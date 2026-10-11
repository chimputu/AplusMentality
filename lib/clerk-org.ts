// lib/clerk-org.ts — Utilities for managing Clerk organization memberships
// Used to add approved tutors to their institution's Clerk organization

/**
 * Add a user to a Clerk organization by its ID.
 * Calls the Clerk API to create an organization membership.
 */
export async function addUserToClerkOrg(userClerkId: string, orgId: string, role: 'org:member' | 'org:admin' = 'org:member') {
  const clerkSecretKey = process.env.CLERK_SECRET_KEY;
  if (!clerkSecretKey) {
    console.warn('[Clerk Org] CLERK_SECRET_KEY not set, skipping org membership creation');
    return { success: false, error: 'CLERK_SECRET_KEY not configured' };
  }

  try {
    const response = await fetch(`https://api.clerk.com/v1/organizations/${orgId}/members/${userClerkId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${clerkSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      // 409 means already a member — treat as success
      if (response.status === 409) {
        console.log(`[Clerk Org] User ${userClerkId} is already a member of org ${orgId}`);
        return { success: true, alreadyMember: true };
      }
      console.error(`[Clerk Org] Failed to add user to org: ${response.status} ${errorText}`);
      return { success: false, error: errorText };
    }

    console.log(`[Clerk Org] Successfully added user ${userClerkId} to org ${orgId} as ${role}`);
    return { success: true };
  } catch (error) {
    console.error('[Clerk Org] Error adding user to org:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Remove a user from a Clerk organization.
 */
export async function removeUserFromClerkOrg(userClerkId: string, orgId: string) {
  const clerkSecretKey = process.env.CLERK_SECRET_KEY;
  if (!clerkSecretKey) {
    console.warn('[Clerk Org] CLERK_SECRET_KEY not set, skipping org membership removal');
    return { success: false, error: 'CLERK_SECRET_KEY not configured' };
  }

  try {
    const response = await fetch(`https://api.clerk.com/v1/organizations/${orgId}/members/${userClerkId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${clerkSecretKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Clerk Org] Failed to remove user from org: ${response.status} ${errorText}`);
      return { success: false, error: errorText };
    }

    console.log(`[Clerk Org] Successfully removed user ${userClerkId} from org ${orgId}`);
    return { success: true };
  } catch (error) {
    console.error('[Clerk Org] Error removing user from org:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Create a Clerk organization for an institution if one doesn't exist.
 */
export async function createClerkOrg(name: string, slug: string) {
  const clerkSecretKey = process.env.CLERK_SECRET_KEY;
  if (!clerkSecretKey) {
    console.warn('[Clerk Org] CLERK_SECRET_KEY not set, skipping org creation');
    return { success: false, error: 'CLERK_SECRET_KEY not configured' };
  }

  try {
    const response = await fetch('https://api.clerk.com/v1/organizations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${clerkSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, slug }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      // 409 means org already exists
      if (response.status === 409) {
        console.log(`[Clerk Org] Organization ${slug} already exists`);
        return { success: true, alreadyExists: true };
      }
      console.error(`[Clerk Org] Failed to create org: ${response.status} ${errorText}`);
      return { success: false, error: errorText };
    }

    const data = await response.json();
    console.log(`[Clerk Org] Created organization: ${slug} (id: ${data.id})`);
    return { success: true, orgId: data.id };
  } catch (error) {
    console.error('[Clerk Org] Error creating org:', error);
    return { success: false, error: String(error) };
  }
}
