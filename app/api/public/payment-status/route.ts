import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/api-auth';
import clientPromise from '@/lib/mongodb';

function setCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, Authorization');
  return response;
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  return setCorsHeaders(response);
}

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get('paymentIntentId');

    if (!paymentIntentId) {
      const response = NextResponse.json(
        { error: 'paymentIntentId is required' },
        { status: 400 }
      );
      return setCorsHeaders(response);
    }

    const client = await clientPromise;
    const dbName = process.env.MONGODB_DB_NAME as string;
    const db = client.db(dbName);
    const orders = db.collection('orders');

    const order = await orders.findOne({
      paymentIntentId: paymentIntentId,
      source: 'public_api',
    });

    if (!order) {
      const response = NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
      return setCorsHeaders(response);
    }

    const response = NextResponse.json({
      paymentIntentId: order.paymentIntentId,
      status: order.status,
      amount: order.amount,
      currency: order.currency,
      refunded: order.refunded || false,
      refundAmount: order.refundAmount || 0,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    });

    return setCorsHeaders(response);
  } catch (error: any) {
    console.error('Payment status API error:', error);
    const response = NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
    return setCorsHeaders(response);
  }
}

