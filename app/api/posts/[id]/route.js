import { NextResponse } from 'next/server';
import { deletePost, getPost } from '@/lib/db';
import { getSessionUser } from '@/lib/session';

export async function GET(request, { params }) {
  try {
    const user = await getSessionUser();
    const currentUserId = user ? user.id : '';
    const { id: postId } = await params;

    const post = await getPost(postId, currentUserId);
    if (!post) {
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, post });
  } catch (error) {
    console.error("GET /api/posts/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch post' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please login to perform actions.' },
        { status: 401 }
      );
    }

    const { id: postId } = await params;
    
    await deletePost(postId, user.id);
    
    return NextResponse.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    console.error("DELETE /api/posts/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete post' },
      { status: 500 }
    );
  }
}
