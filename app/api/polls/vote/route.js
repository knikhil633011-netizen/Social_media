import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { voteOnPoll } from '@/lib/db';
import { getSessionUser } from '@/lib/session';

export async function POST(request) {
  try {
    const user = await getSessionUser();
    
    // Hash client IP to enforce one-vote-per-IP privately
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               '127.0.0.1';
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex');

    const body = await request.json();
    const { pollId, optionIdx } = body;

    if (!pollId || optionIdx === undefined || optionIdx === null) {
      return NextResponse.json(
        { success: false, error: 'Invalid vote parameters.' },
        { status: 400 }
      );
    }

    const idx = parseInt(optionIdx, 10);
    if (isNaN(idx) || idx < 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid option index.' },
        { status: 400 }
      );
    }

    try {
      const vote = await voteOnPoll(pollId, idx, user?.id || null, ipHash);
      return NextResponse.json({ success: true, vote }, { status: 201 });
    } catch (err) {
      if (err.message === 'Already voted') {
        return NextResponse.json(
          { success: false, error: 'You have already voted on this poll.' },
          { status: 400 }
        );
      }
      throw err;
    }
  } catch (error) {
    console.error("POST /api/polls/vote error:", error);
    return NextResponse.json(
      { success: false, error: 'Failed to cast vote.' },
      { status: 500 }
    );
  }
}
