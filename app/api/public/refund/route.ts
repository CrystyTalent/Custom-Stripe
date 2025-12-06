import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/api-auth';
import { stripe } from '@/lib/stripe';
import clientPromise from '@/lib/mongodb';

function setCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
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
    const { paymentIntentId, amount } = body;

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

    // Verify order exists
    const order = await orders.findOne({
      paymentIntentId: paymentIntentId,
      source: 'public_api',
    });

    if (!order) {
      const response = NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
      return setCorsHeaders(response);
    }

    if (order.status !== 'succeeded') {
      const response = NextResponse.json(
        { error: 'Only successful payments can be refunded' },
        { status: 400 }
      );
      return setCorsHeaders(response);
    }

    if (order.refunded) {
      const response = NextResponse.json(
        { error: 'This order has already been fully refunded' },
        { status: 400 }
      );
      return setCorsHeaders(response);
    }

    // Retrieve payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (!paymentIntent.latest_charge) {
      const response = NextResponse.json(
        { error: 'No charge found for this payment' },
        { status: 400 }
      );
      return setCorsHeaders(response);
    }

    // Create refund
    const refundParams: any = {
      charge: paymentIntent.latest_charge as string,
    };

    const alreadyRefunded = order.refundAmount || 0;
    if (amount && amount > 0 && amount < order.amount) {
      if (alreadyRefunded + amount > order.amount) {
        const response = NextResponse.json(
          { error: 'Refund amount exceeds remaining order amount' },
          { status: 400 }
        );
        return setCorsHeaders(response);
      }
      refundParams.amount = Math.round(amount * 100);
    }

    const refund = await stripe.refunds.create(refundParams);

    // Update order
    const newRefundAmount = amount ? amount : order.amount;
    const totalRefunded = alreadyRefunded + newRefundAmount;
    const isFullyRefunded = totalRefunded >= order.amount;

    await orders.updateOne(
      { paymentIntentId: paymentIntentId },
      {
        $set: {
          status: isFullyRefunded ? 'refunded' : 'succeeded',
          refunded: isFullyRefunded,
          refundAmount: totalRefunded,
          updatedAt: new Date(),
        },
      }
    );

    const response = NextResponse.json({
      success: true,
      refund: {
        id: refund.id,
        amount: refund.amount / 100,
        status: refund.status,
      },
      order: {
        status: isFullyRefunded ? 'refunded' : 'succeeded',
        refundAmount: totalRefunded,
      },
    });

    return setCorsHeaders(response);
  } catch (error: any) {
    console.error('Public refund API error:', error);
    const response = NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
    return setCorsHeaders(response);
  }
}

