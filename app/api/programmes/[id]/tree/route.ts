import { NextRequest, NextResponse } from 'next/server';
import { getProgrammeWithTree } from '@/lib/actions/programme-tree';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tree = await getProgrammeWithTree(id);
    return NextResponse.json(tree);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch programme tree' },
      { status: 404 }
    );
  }
}
