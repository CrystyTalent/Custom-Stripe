import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getSession } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { paymentId } = await params;

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    let client;
    try {
      client = await clientPromise;
    } catch (dbError) {
      console.error('MongoDB connection error:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const dbName = process.env.MONGODB_DB_NAME as string;
    const db = client.db(dbName);
    const payments = db.collection('payments');

    // Get payment by paymentId and verify it belongs to the user
    const payment = await payments.findOne({
      paymentId: paymentId,
      email: session.email
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Check if already refunded
    const currentState = payment.state?.toLowerCase() || '';
    if (currentState === 'refunded') {
      return NextResponse.json(
        { error: 'Payment has already been refunded' },
        { status: 400 }
      );
    }

    // Check if payment is eligible for refund (must be completed or paid)
    const eligibleStates = ['completed', 'paid'];
    if (!eligibleStates.includes(currentState)) {
      return NextResponse.json(
        { error: 'Only completed or paid payments can be refunded' },
        { status: 400 }
      );
    }

    // Update payment status to refunded
    const result = await payments.updateOne(
      { paymentId: paymentId },
      { 
        $set: { 
          state: 'refunded',
          updatedAt: new Date(),
          refundedAt: new Date()
        } 
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Refund processed successfully',
      paymentId: paymentId,
      status: 'refunded'
    }, { status: 200 });
  } catch (error) {
    console.error('Refund error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

