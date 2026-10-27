import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  try {
    const { user } = await requireAuth();
    const hasInstitution = !!(user.institutionId || user.universityId);
    return NextResponse.json({ role: user.role, hasInstitution });
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}