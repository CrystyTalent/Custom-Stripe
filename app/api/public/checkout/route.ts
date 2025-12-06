import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/api-auth';
import { stripe } from '@/lib/stripe';
import clientPromise from '@/lib/mongodb';

// Enable CORS for public API
function setCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, Authorization');
  return response;
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  return setCorsHeaders(response);
}

export async function POST(request: NextRequest) {
  try {
    // Validate API key
    const authResult = await validateApiKey(request);
    if (!authResult.valid) {
      const response = NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
      return setCorsHeaders(response);
    }

    const body = await request.json();
    const { amount, currency = 'usd', email, metadata = {} } = body;

    // Validate required fields
    if (!amount || amount <= 0) {
      const response = NextResponse.json(
        { error: 'Amount is required and must be greater than 0' },
        { status: 400 }
      );
      return setCorsHeaders(response);
    }

    if (!email || !email.includes('@')) {
      const response = NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
      return setCorsHeaders(response);
    }

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      metadata: {
        ...metadata,
        source: 'public_api',
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Save order record
    const client = await clientPromise;
    const dbName = process.env.MONGODB_DB_NAME as string;
    const db = client.db(dbName);
    const orders = db.collection('orders');

    await orders.insertOne({
      userId: 'public_api',
      paymentIntentId: paymentIntent.id,
      amount: amount,
      currency: currency.toLowerCase(),
      status: 'pending',
      refunded: false,
      email: email,
      source: 'public_api',
      metadata: metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const response = NextResponse.json({
      success: true,
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: amount,
      currency: currency.toLowerCase(),
    });

    return setCorsHeaders(response);
  } catch (error: any) {
    console.error('Public checkout API error:', error);
    const response = NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
    return setCorsHeaders(response);
  }
}

