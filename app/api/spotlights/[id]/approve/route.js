import { NextResponse } from 'next/server';
import { approveSpotlight, deleteSpotlight } from '@/lib/db';
import { getSessionUser } from '@/lib/session';

export async function POST(request, { params }) {
  try {
    const user = await getSessionUser();
    if (!user || user.username !== 'nikhil') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized.' },
        { status: 403 }
      );
    }

    const { id: spotlightId } = await params;
    const spotlight = await approveSpotlight(spotlightId);

    return NextResponse.json({ success: true, spotlight });
  } catch (error) {
    console.error("POST /api/spotlights/[id]/approve error:", error);
    return NextResponse.json(
      { success: false, error: 'Failed to approve spotlight request.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getSessionUser();
    if (!user || user.username !== 'nikhil') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized.' },
        { status: 403 }
      );
    }

    const { id: spotlightId } = await params;
    await deleteSpotlight(spotlightId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/spotlights/[id]/approve error:", error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete/reject spotlight request.' },
      { status: 500 }
    );
  }
}
