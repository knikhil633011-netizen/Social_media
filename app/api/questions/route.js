import { NextResponse } from 'next/server';
import { addQuestion, getQuestions } from '@/lib/db';
import { getSessionUser } from '@/lib/session';

export async function POST(request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please login to submit a question.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const content = body.content;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Question content cannot be empty' },
        { status: 400 }
      );
    }

    if (content.trim().length > 280) {
      return NextResponse.json(
        { success: false, error: 'Question is too long (max 280 characters)' },
        { status: 400 }
      );
    }

    const question = await addQuestion(content.trim());
    return NextResponse.json({ success: true, question }, { status: 201 });
  } catch (error) {
    console.error("POST /api/questions error:", error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit question' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
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
        { success: false, error: 'Access denied. Questions inbox is restricted to the administrator.' },
        { status: 403 }
      );
    }

    const questions = await getQuestions();
    return NextResponse.json({ success: true, questions });
  } catch (error) {
    console.error("GET /api/questions error:", error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch questions inbox' },
      { status: 500 }
    );
  }
}
