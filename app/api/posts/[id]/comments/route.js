import { NextResponse } from 'next/server';
import { addComment } from '@/lib/db';
import { getSessionUser } from '@/lib/session';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { isProfane } from '@/lib/profanity';

function getClientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || '127.0.0.1';
}



export async function POST(request, { params }) {
  try {
    const { id: postId } = await params;
    const user = await getSessionUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please login to comment.' },
        { status: 401 }
      );
    }

    if (user.username !== 'nikhil') {
      return NextResponse.json(
        { success: false, error: 'Access denied. Comments are restricted to the administrator.' },
        { status: 403 }
      );
    }
    
    const ip = getClientIp(request);
    
    // Rate limit commenting
    const rateLimitIp = await checkRateLimit(`ip_comment_${ip}`, RATE_LIMITS.COMMENT_CREATE.limit, RATE_LIMITS.COMMENT_CREATE.windowMs);
    const rateLimitUser = await checkRateLimit(`user_comment_${user.id}`, RATE_LIMITS.COMMENT_CREATE.limit, RATE_LIMITS.COMMENT_CREATE.windowMs);
    
    if (rateLimitIp.isLimited || rateLimitUser.isLimited) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded. Max 15 comments per minute.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const content = body.content;
    const attachment = body.attachment || null;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Comment content cannot be empty' },
        { status: 400 }
      );
    }

    if (content.trim().length > 280) {
      return NextResponse.json(
        { success: false, error: 'Comment is too long (max 280 characters)' },
        { status: 400 }
      );
    }

    if (isProfane(content)) {
      return NextResponse.json(
        { success: false, error: "Inappropriate language detected. Let's keep the echo room clean!" },
        { status: 400 }
      );
    }

    const newComment = await addComment(postId, content.trim(), user.id, attachment);
    return NextResponse.json({ success: true, comment: newComment }, { status: 201 });
  } catch (error) {
    console.error("POST /api/posts/[id]/comments error:", error);
    return NextResponse.json(
      { success: false, error: 'Failed to add comment' },
      { status: 500 }
    );
  }
}
