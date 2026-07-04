import { NextResponse } from 'next/server';
import { toggleReaction } from '@/lib/db';
import { getSessionUser } from '@/lib/session';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';

const ALLOWED_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '🙌', '💯', '🎉', '👏', '👀', '✨', '💔', '🤔', '😎', '🥺', '🤩', '🥳', '🚀', '💡', '🎨', '👑', '😴', '💩', '🤪', '😅'];

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
        { success: false, error: 'Unauthorized. Please login to react.' },
        { status: 401 }
      );
    }

    if (user.username !== 'nikhil') {
      return NextResponse.json(
        { success: false, error: 'Access denied. Reactions are restricted to the administrator.' },
        { status: 403 }
      );
    }
    
    const ip = getClientIp(request);
    
    // Rate limit reaction toggling
    const rateLimitIp = await checkRateLimit(`ip_react_${ip}`, RATE_LIMITS.REACTION_TOGGLE.limit, RATE_LIMITS.REACTION_TOGGLE.windowMs);
    const rateLimitUser = await checkRateLimit(`user_react_${user.id}`, RATE_LIMITS.REACTION_TOGGLE.limit, RATE_LIMITS.REACTION_TOGGLE.windowMs);
    
    if (rateLimitIp.isLimited || rateLimitUser.isLimited) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded. Too many reactions.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const emojiChar = body.emoji;

    if (!emojiChar || typeof emojiChar !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Emoji is required' },
        { status: 400 }
      );
    }

    if (!ALLOWED_EMOJIS.includes(emojiChar)) {
      return NextResponse.json(
        { success: false, error: 'Emoji not allowed' },
        { status: 400 }
      );
    }

    const result = await toggleReaction(postId, emojiChar, user.id);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("POST /api/posts/[id]/react error:", error);
    return NextResponse.json(
      { success: false, error: 'Failed to update reaction' },
      { status: 500 }
    );
  }
}
