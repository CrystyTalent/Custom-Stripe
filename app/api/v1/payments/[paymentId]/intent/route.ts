import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const { paymentId } = await params;
    const body = await request.json();
    const { email } = body;

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

    // Get payment by paymentId - only if status is pending
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

    // Create Payment Intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: payment.amount, // Already in cents
      currency: payment.currency || 'usd',
      metadata: {
        paymentId: payment.paymentId,
        orderId: payment.metadata || '',
      },
      receipt_email: email || payment.email,
      description: payment.description,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret
    }, { status: 200 });
  } catch (error) {
    console.error('Create payment intent error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}

