import { NextResponse } from 'next/server';
import { incrementDownloadCount } from '@/lib/db';
import { getSessionUser } from '@/lib/session';

export async function POST(request, { params }) {
  try {
    const { id: postId } = await params;
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const result = await incrementDownloadCount(postId);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Download tracking API error:", error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
