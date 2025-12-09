import { NextRequest, NextResponse } from 'next/server';
import { getApiKeyFromRequest, validateApiKey } from '@/lib/auth';
import { addCorsHeaders } from '@/lib/cors';
import { randomUUID } from 'crypto';
import clientPromise from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    // Try API key authentication first
    const apiKey = getApiKeyFromRequest(request);

    if (apiKey) {
      const apiKeyUser = await validateApiKey(apiKey);

      if (!apiKeyUser) {
        const response = NextResponse.json(
          { error: 'Invalid API key' },
          { status: 401 }
        );
        return addCorsHeaders(response, request);
      }

      // Validate API key
      const paymentId = randomUUID();
      const body = await request.json();
      const { amount, currency, email, username, description, success_url, metadata } = body;

      const data = {
        paymentId,
        amount,
        currency,
        email,
        username,
        description,
        success_url,
        metadata: metadata.order_id,
        state: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      try {
        const client = await clientPromise;
        const dbName = process.env.MONGODB_DB_NAME as string;
        const db = client.db(dbName);
        const payments = db.collection('payments');

        await payments.insertOne(data as unknown as Record<string, unknown>);

      } catch (dbError) {
        console.error('MongoDB connection error:', dbError);
        const response = NextResponse.json(
          { error: 'Database connection failed' },
          { status: 500 }
        );
        return addCorsHeaders(response, request);
      }

      const response = NextResponse.json(
        { message: 'Payment created successfully', paymentId: paymentId },
        { status: 200 }
      );
      return addCorsHeaders(response, request);

    } else {
      // Fall back to session-based authentication
      const response = NextResponse.json(
        { error: 'Unauthorized. Please provide an API key or login.' },
        { status: 401 }
      );
      return addCorsHeaders(response, request);
    }

  } catch (error) {

    console.error('Create payment error:', error);

    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
    return addCorsHeaders(response, request);
  }
}