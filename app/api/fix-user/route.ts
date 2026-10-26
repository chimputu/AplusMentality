import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

/**
 * Debug endpoint to create/update a user record when Clerk webhook fails.
 * RESTRICTED: Only SUPER_ADMIN can use this endpoint.
 * TODO: Remove this endpoint before production deployment.
 */
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({
        error: 'Not logged in. Please sign in first.'
      }, { status: 401 });
    }

    // SECURITY: Only allow SUPER_ADMIN to use this endpoint
    const existingUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    });

    if (!existingUser || existingUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({
        error: 'Forbidden. This endpoint is restricted to SUPER_ADMIN only.'
      }, { status: 403 });
    }

    // Get user data from Clerk
    const { sessionClaims } = await auth();
    const claims = sessionClaims as any;

    // Try all possible email locations
    const email = claims?.email ||
                  claims?.user?.email ||
                  claims?.emailAddress ||
                  claims?.primaryEmailAddress ||
                  claims?.primaryEmail ||
                  `user_${Date.now()}@temp.com`;

    console.log('[fix-user] Creating/updating user:', { userId, email });

    // Check if user exists by clerkId
    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (user) {
      return NextResponse.json({
        message: 'User already exists!',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      });
    }

    // Check if user exists by email
    const duplicateByEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (duplicateByEmail) {
      // Update clerkId
      user = await prisma.user.update({
        where: { email },
        data: { clerkId: userId },
      });
      return NextResponse.json({
        message: 'User updated with clerkId!',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      });
    }

    // Create new user with STUDENT role (not ADMIN)
    user = await prisma.user.create({
      data: {
        clerkId: userId,
        email: email,
        name: claims?.firstName ? `${claims.firstName} ${claims.lastName || ''}`.trim() : null,
        role: 'STUDENT', // Default to STUDENT, not ADMIN
      },
    });

    return NextResponse.json({
      message: 'User created successfully with STUDENT role.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }
    });

  } catch (error: any) {
    console.error('[fix-user] Error:', error);
    return NextResponse.json({
      error: 'Failed to fix user',
      details: error?.message || String(error),
    }, { status: 500 });
  }
}