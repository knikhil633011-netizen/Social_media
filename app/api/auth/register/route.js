import { NextResponse } from 'next/server';
import { createUser, getUserByUsername } from '@/lib/db';
import { setSessionCookie } from '@/lib/session';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim();
    
    // Validate username (alphanumeric and underscores only, length 3-20)
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(cleanUsername)) {
      return NextResponse.json(
        { success: false, error: 'Username must be 3-20 characters, containing only letters, numbers, or underscores.' },
        { status: 400 }
      );
    }

    if (password.length < 3) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 3 characters.' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await getUserByUsername(cleanUsername);
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Username already taken. Pick another handle.' },
        { status: 400 }
      );
    }

    // Create user
    const newUser = await createUser(cleanUsername, password);
    
    // Set cookie
    await setSessionCookie(newUser);

    return NextResponse.json({
      success: true,
      user: { id: newUser.id, username: newUser.username }
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, error: 'Failed to create account.' },
      { status: 500 }
    );
  }
}
