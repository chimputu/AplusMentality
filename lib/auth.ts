import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from './prisma';

export async function requireAuth(allowedRoles?: string[]) {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  // ✅ Try to find user by clerkId first
  let user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  // ✅ If user exists, return it immediately
  if (user) {
    const role = user.role;
    if (allowedRoles && !allowedRoles.includes(role)) {
      redirect('/unauthorized');
    }
    return { userId, role, user };
  }

  // ✅ User not found by clerkId - try to find by email or create
  const { sessionClaims } = await auth();
  const claims = sessionClaims as any;
  
  const email = claims?.email || 
                claims?.user?.email || 
                claims?.emailAddress ||
                `user_${Date.now()}@temp.com`;

  try {
    // ✅ Check if user exists by email
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // ✅ Update the clerkId if user exists by email
      user = await prisma.user.update({
        where: { email },
        data: { clerkId: userId },
      });
      console.log('✅ User updated with clerkId:', user.email);
    } else {
      // ✅ Create new user
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: email,
          name: claims?.firstName ? `${claims.firstName} ${claims.lastName || ''}`.trim() : null,
          role: 'STUDENT',
        },
      });
      console.log('✅ New user created:', user.email);
    }
  } catch (error) {
    console.error('Failed to create/update user:', error);
    
    // ✅ Last resort: try with a completely unique email
    try {
      const uniqueEmail = `user_${Date.now()}_${userId.slice(-6)}@temp.com`;
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: uniqueEmail,
          name: null,
          role: 'STUDENT',
        },
      });
      console.log('✅ User created with unique email:', uniqueEmail);
    } catch (retryError) {
      console.error('Fatal: Could not create user:', retryError);
      
      // ✅ One more attempt - maybe the user was created in the meantime
      user = await prisma.user.findUnique({
        where: { clerkId: userId },
      });
      
      if (!user) {
        redirect('/unauthorized');
      }
    }
  }

  // ✅ If still no user, redirect
  if (!user) {
    console.error('❌ Could not find or create user for clerkId:', userId);
    redirect('/unauthorized');
  }

  const role = user.role;
  
  if (allowedRoles && !allowedRoles.includes(role)) {
    redirect('/unauthorized');
  }

  return { userId, role, user };
}