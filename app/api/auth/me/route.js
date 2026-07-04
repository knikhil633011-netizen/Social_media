import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';

export async function GET() {
  try {
    const user = await getSessionUser();
    
    if (!user) {
      return NextResponse.json({ success: true, user: null });
    }
    
    return NextResponse.json({
      success: true,
      user: { id: user.id, username: user.username }
    });
  } catch (error) {
    console.error("Auth status error:", error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify session status' },
      { status: 500 }
    );
  }
}
