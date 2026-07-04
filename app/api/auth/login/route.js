import { NextResponse } from 'next/server';
import { getUserByUsername, hashPassword } from '@/lib/db';
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

    const cleanUsername = username.trim().toLowerCase();
    const user = await getUserByUsername(cleanUsername);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    const hashedIncoming = hashPassword(password);
    if (user.password_hash !== hashedIncoming) {
      return NextResponse.json(
        { success: false, error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Set cookie
    await setSessionCookie(user);

    return NextResponse.json({
      success: true,
      user: { id: user.id, username: user.username }
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: 'Failed to authorize.' },
      { status: 500 }
    );
  }
}
