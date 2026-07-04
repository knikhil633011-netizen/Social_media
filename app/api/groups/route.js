import { NextResponse } from 'next/server';
import { getGroups, createGroup } from '@/lib/db';
import { getSessionUser } from '@/lib/session';

export async function GET() {
  try {
    const groups = await getGroups();
    return NextResponse.json({ success: true, groups });
  } catch (error) {
    console.error("GET /api/groups error:", error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch groups' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please login to create a group.' },
        { status: 401 }
      );
    }

    const { name, description } = await request.json();

    if (!name || !description) {
      return NextResponse.json(
        { success: false, error: 'Group name and description are required' },
        { status: 400 }
      );
    }

    const cleanName = name.trim();
    const cleanDesc = description.trim();

    if (cleanName.length < 3 || cleanName.length > 40) {
      return NextResponse.json(
        { success: false, error: 'Group name must be between 3 and 40 characters' },
        { status: 400 }
      );
    }

    if (cleanDesc.length < 10 || cleanDesc.length > 200) {
      return NextResponse.json(
        { success: false, error: 'Group description must be between 10 and 200 characters' },
        { status: 400 }
      );
    }

    // Validate that community names do not contain bad words
    const { isProfane } = await import('@/lib/profanity');
    if (isProfane(cleanName) || isProfane(cleanDesc)) {
      return NextResponse.json(
        { success: false, error: "Inappropriate language detected. Let's keep group names clean!" },
        { status: 400 }
      );
    }

    const newGroup = await createGroup(cleanName, cleanDesc, user.id);
    return NextResponse.json({ success: true, group: newGroup }, { status: 201 });
  } catch (error) {
    console.error("POST /api/groups error:", error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create group' },
      { status: 500 }
    );
  }
}
