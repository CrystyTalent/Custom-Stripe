import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
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

    // Get payment by paymentId - only return if status is pending
    const payment = await payments.findOne({ 
      paymentId: paymentId,
      state: 'pending'
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found or already processed' },
        { status: 404 }
      );
    }

    // Convert amount from cents to dollars
    const totalAmount = (payment.amount / 100).toFixed(2);

    return NextResponse.json({
      payment: {
        paymentId: payment.paymentId,
        amount: totalAmount,
        currency: payment.currency,
        email: payment.email,
        name: payment.username,
        description: payment.description,
        cartItems: payment.cartItems || []
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Get payment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

