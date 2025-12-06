import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import clientPromise from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { paymentIntentId, amount } = body;

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment intent ID is required' },
        { status: 400 }
      );
    }

    // Verify the order belongs to the user
    const client = await clientPromise;
    const dbName = process.env.MONGODB_DB_NAME as string;
    const db = client.db(dbName);
    const orders = db.collection('orders');

    const order = await orders.findOne({
      paymentIntentId: paymentIntentId,
      userId: session.userId,
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    if (order.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Only successful payments can be refunded' },
        { status: 400 }
      );
    }

    // Check if already fully refunded
    if (order.refunded) {
      return NextResponse.json(
        { error: 'This order has already been fully refunded' },
        { status: 400 }
      );
    }

    // Check if partial refund would exceed order amount
    if (amount && amount > 0) {
      const alreadyRefunded = order.refundAmount || 0;
      if (alreadyRefunded + amount > order.amount) {
        return NextResponse.json(
          { error: 'Refund amount exceeds remaining order amount' },
          { status: 400 }
        );
      }
    }

    // Retrieve the payment intent to get the charge ID
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (!paymentIntent.latest_charge) {
      return NextResponse.json(
        { error: 'No charge found for this payment' },
        { status: 400 }
      );
    }

    // Create refund
    const refundParams: any = {
      charge: paymentIntent.latest_charge as string,
    };

    // If partial refund amount is specified
    if (amount && amount > 0 && amount < order.amount) {
      refundParams.amount = Math.round(amount * 100); // Convert to cents
    }

    const refund = await stripe.refunds.create(refundParams);

    // Update order in database
    const alreadyRefunded = order.refundAmount || 0;
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

    return NextResponse.json({
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
  } catch (error: any) {
    console.error('Refund error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process refund' },
      { status: 500 }
    );
  }
}

