import crypto from 'crypto';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'echo_session_token';
const SECRET_KEY = process.env.SESSION_SECRET_SALT || 'default-secret-salt-xyz-12345-echo-room';

/**
 * Creates a cryptographically signed session token
 */
export function createSessionToken(payload) {
  // Set expiration to 7 days
  const data = {
    ...payload,
    expires: Date.now() + 3600000 * 24 * 7
  };
  const base64Payload = Buffer.from(JSON.stringify(data)).toString('base64');
  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(base64Payload)
    .digest('hex');
  
  return `${base64Payload}.${signature}`;
}

/**
 * Verifies and parses a signed session token
 */
export function verifySessionToken(token) {
  if (!token) return null;
  
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  
  const [base64Payload, signature] = parts;
  const expectedSignature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(base64Payload)
    .digest('hex');
    
  if (signature !== expectedSignature) return null;
  
  try {
    const jsonStr = Buffer.from(base64Payload, 'base64').toString('utf8');
    const payload = JSON.parse(jsonStr);
    
    // Check expiration
    if (Date.now() > payload.expires) {
      return null;
    }
    
    return payload;
  } catch (e) {
    return null;
  }
}

/**
 * Next.js App Router Helper to get the logged-in user session
 */
export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

/**
 * Next.js App Router Helper to write the cookie
 */
export async function setSessionCookie(user) {
  const token = createSessionToken({ id: user.id, username: user.username });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    maxAge: 3600 * 24 * 7, // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  });
}

/**
 * Next.js App Router Helper to clear the cookie
 */
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, '', {
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  });
}
