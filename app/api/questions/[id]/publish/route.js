import { NextResponse } from 'next/server';
import { getQuestions, deleteQuestion, createPost } from '@/lib/db';
import { getSessionUser } from '@/lib/session';

export async function POST(request, { params }) {
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
        { success: false, error: 'Access denied. Only the administrator can publish replies.' },
        { status: 403 }
      );
    }

    const { id: questionId } = await params;
    const body = await request.json();
    const reply = body.reply;

    if (!reply || typeof reply !== 'string' || reply.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Reply content cannot be empty' },
        { status: 400 }
      );
    }

    // Fetch questions to find the original question's content
    const questions = await getQuestions();
    const question = questions.find(q => q.id === questionId);

    if (!question) {
      return NextResponse.json(
        { success: false, error: 'Question not found in inbox' },
        { status: 404 }
      );
    }

    // Format the published post
    const postContent = `❓ Anonymous Question:\n"${question.content}"\n\n💡 Admin Response:\n${reply.trim()}`;

    // Publish to the global feed under admin's ID
    const newPost = await createPost(
      postContent,
      user.id,
      null, // groupId
      null, // attachment
      'wholesome', // vibe
      null, // expiresAt
      false, // isSecretDrop
      0 // downloadLimit
    );

    // Delete the question from the inbox queue
    await deleteQuestion(questionId);

    return NextResponse.json({ success: true, post: newPost });
  } catch (error) {
    console.error("POST /api/questions/[id]/publish error:", error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to publish Q&A reply' },
      { status: 500 }
    );
  }
}
