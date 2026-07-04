import { NextResponse } from 'next/server';
import { getPosts, createPost } from '@/lib/db';
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

export async function GET(request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please login to enter the void.' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('group_id') || null;
    
    const posts = await getPosts(user.id, groupId);
    return NextResponse.json({ success: true, posts });
  } catch (error) {
    console.error("GET /api/posts error:", error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch feed' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please login to speak in the void.' },
        { status: 401 }
      );
    }

    if (user.username !== 'nikhil') {
      return NextResponse.json(
        { success: false, error: 'Access denied. Only the administrator can post global whispers.' },
        { status: 403 }
      );
    }

    const ip = getClientIp(request);
    
    // Rate limit check
    const rateLimitIp = await checkRateLimit(`ip_post_${ip}`, RATE_LIMITS.POST_CREATE.limit, RATE_LIMITS.POST_CREATE.windowMs);
    const rateLimitUser = await checkRateLimit(`user_post_${user.id}`, RATE_LIMITS.POST_CREATE.limit, RATE_LIMITS.POST_CREATE.windowMs);
    
    if (rateLimitIp.isLimited || rateLimitUser.isLimited) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded. Max 5 posts per hour.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const content = body.content;
    const groupId = body.group_id || null;
    const attachment = body.attachment || null;
    const vibe = body.vibe || 'default';
    const isSecretDrop = !!body.is_secret_drop;
    const downloadLimit = Number(body.download_limit) || 0;
    
    // Calculate expiration on the server to prevent clock drift and local timezone issues
    const expireOption = body.expire_option || 'never';
    let expiresAt = null;
    if (expireOption === '1h') {
      expiresAt = new Date(Date.now() + 3600000).toISOString();
    } else if (expireOption === '6h') {
      expiresAt = new Date(Date.now() + 3600000 * 6).toISOString();
    } else if (expireOption === '24h') {
      expiresAt = new Date(Date.now() + 3600000 * 24).toISOString();
    }

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Content is required' },
        { status: 400 }
      );
    }

    const trimmedContent = content.trim();
    if (trimmedContent.length === 0 || trimmedContent.length > 280) {
      return NextResponse.json(
        { success: false, error: 'Post must be between 1 and 280 characters' },
        { status: 400 }
      );
    }

    if (isProfane(trimmedContent)) {
      return NextResponse.json(
        { success: false, error: "Inappropriate language detected. Let's keep the echo room clean!" },
        { status: 400 }
      );
    }

    const newPost = await createPost(trimmedContent, user.id, groupId, attachment, vibe, expiresAt, isSecretDrop, downloadLimit);

    return NextResponse.json({ success: true, post: newPost }, { status: 201 });
  } catch (error) {
    console.error("POST /api/posts error:", error);
    return NextResponse.json(
      { success: false, error: 'Failed to create post' },
      { status: 500 }
    );
  }
}
