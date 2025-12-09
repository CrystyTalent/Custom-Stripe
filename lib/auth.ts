import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { Session } from './types';
import clientPromise from './mongodb';

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  
  if (!sessionCookie) {
    return null;
  }

  try {
    return JSON.parse(sessionCookie.value) as Session;
  } catch {
    return null;
  }
}

export async function setSession(session: Session) {
  const cookieStore = await cookies();
  cookieStore.set('session', JSON.stringify(session), {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 1 day
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}

/**
 * Get API key from request headers
 * Supports both 'Authorization: Bearer <key>' and 'X-API-Key: <key>' formats
 */
export function getApiKeyFromRequest(request: NextRequest): string | null {
  // Try Authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Try X-API-Key header
  const apiKeyHeader = request.headers.get('x-api-key');
  if (apiKeyHeader) {
    return apiKeyHeader;
  }

  return null;
}

/**
 * Validate API key and return user information
 */
export async function validateApiKey(apiKey: string): Promise<boolean | null> {
  if (!apiKey || !apiKey.startsWith('payzo_live_')) {
    return null;
  }

  try {
    const client = await clientPromise;
    const dbName = process.env.MONGODB_DB_NAME as string;
    const db = client.db(dbName);
    const users = db.collection('users');

    const user = await users.findOne(
      { productionApiKey: apiKey },
      { projection: { _id: 1, email: 1, username: 1 } }
    );

    if (!user) {
      return null;
    }

    return true;
  } catch (error) {
    console.error('Error validating API key:', error);
    return null;
  }
}