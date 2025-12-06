import { NextRequest } from 'next/server';

export async function validateApiKey(request: NextRequest): Promise<{ valid: boolean; error?: string }> {
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '');

  if (!apiKey) {
    return { valid: false, error: 'API key is required. Include it in the X-API-Key header or Authorization: Bearer header.' };
  }

  const globalApiKey = process.env.PUBLIC_API_KEY;

  if (!globalApiKey) {
    return { valid: false, error: 'API key validation is not configured. Please set PUBLIC_API_KEY in environment variables.' };
  }

  if (apiKey === globalApiKey) {
    return { valid: true };
  }

  return { valid: false, error: 'Invalid API key' };
}
