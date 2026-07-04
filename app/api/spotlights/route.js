import { NextResponse } from 'next/server';
import { submitSpotlight, getApprovedSpotlights, getPendingSpotlights } from '@/lib/db';
import { getSessionUser } from '@/lib/session';

export async function GET(request) {
  try {
    const user = await getSessionUser();
    
    // Check if the admin is requesting the pending queue list
    const url = new URL(request.url);
    const mode = url.searchParams.get('mode');

    if (mode === 'pending') {
      if (!user || user.username !== 'nikhil') {
        return NextResponse.json(
          { success: false, error: 'Unauthorized.' },
          { status: 403 }
        );
      }
      const spotlights = await getPendingSpotlights();
      return NextResponse.json({ success: true, spotlights });
    }

    const spotlights = await getApprovedSpotlights();
    return NextResponse.json({ success: true, spotlights });
  } catch (error) {
    console.error("GET /api/spotlights error:", error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch spotlights' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please login to pitch a spotlight.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, description, link, category } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Title cannot be empty.' },
        { status: 400 }
      );
    }

    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Description cannot be empty.' },
        { status: 400 }
      );
    }

    const validCategories = ['business', 'community', 'project'];
    if (!category || !validCategories.includes(category)) {
      return NextResponse.json(
        { success: false, error: 'Invalid spotlight category.' },
        { status: 400 }
      );
    }

    const spotlight = await submitSpotlight(
      title.trim(),
      description.trim(),
      link ? String(link).trim() : null,
      category,
      user.id
    );

    return NextResponse.json({ success: true, spotlight }, { status: 201 });
  } catch (error) {
    console.error("POST /api/spotlights error:", error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit spotlight pitch.' },
      { status: 500 }
    );
  }
}
