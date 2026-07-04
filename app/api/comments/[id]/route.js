import { NextResponse } from 'next/server';
import { deleteComment } from '@/lib/db';
import { getSessionUser } from '@/lib/session';

export async function DELETE(request, { params }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please login to delete comments.' },
        { status: 401 }
      );
    }

    const { id: commentId } = await params;
    
    await deleteComment(commentId, user.id);
    
    return NextResponse.json({ success: true, message: 'Comment deleted successfully' });
  } catch (error) {
    console.error("DELETE /api/comments/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete comment' },
      { status: 500 }
    );
  }
}
