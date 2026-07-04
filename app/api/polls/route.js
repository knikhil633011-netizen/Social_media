import { NextResponse } from 'next/server';
import { createPoll, getActivePoll } from '@/lib/db';
import { getSessionUser } from '@/lib/session';

export async function GET(request) {
  try {
    const poll = await getActivePoll();
    return NextResponse.json({ success: true, poll });
  } catch (error) {
    console.error("GET /api/polls error:", error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch active poll' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized.' },
        { status: 401 }
      );
    }

    if (user.username !== 'nikhil') {
      return NextResponse.json(
        { success: false, error: 'Access denied. Only the administrator can launch polls.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { question, options } = body;

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Poll question cannot be empty.' },
        { status: 400 }
      );
    }

    if (!options || !Array.isArray(options) || options.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Poll must have at least 2 options.' },
        { status: 400 }
      );
    }

    const cleanedOptions = options.map(o => String(o).trim()).filter(o => o.length > 0);
    if (cleanedOptions.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Poll must have at least 2 valid non-empty options.' },
        { status: 400 }
      );
    }

    const poll = await createPoll(question.trim(), cleanedOptions);
    return NextResponse.json({ success: true, poll }, { status: 201 });
  } catch (error) {
    console.error("POST /api/polls error:", error);
    return NextResponse.json(
      { success: false, error: 'Failed to create poll' },
      { status: 500 }
    );
  }
}
