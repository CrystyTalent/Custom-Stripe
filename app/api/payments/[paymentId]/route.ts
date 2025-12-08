import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

// GET: Fetch payment details by paymentId (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> | { paymentId: string } }
) {
  try {
    // Handle both Promise and direct params (for Next.js 13+ compatibility)
    const resolvedParams = params instanceof Promise ? await params : params;
    const { paymentId } = resolvedParams;

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    // Connect to MongoDB with timeout
    let client;
    try {
      // Add timeout wrapper to prevent long waits
      const connectionPromise = clientPromise;
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Database connection timeout')), 10000); // 10 second timeout
      });
      
      client = await Promise.race([connectionPromise, timeoutPromise]) as Awaited<typeof clientPromise>;
    } catch (dbError: unknown) {
      console.error('MongoDB connection error:', dbError);
      const errorMessage = (dbError as Error)?.message || 'Database connection failed';
      
      // Check if it's a timeout or connection error
      if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEOUT')) {
        return NextResponse.json(
          { error: 'Database connection timeout. Please check your internet connection and try again.' },
          { status: 503 } // Service Unavailable
        );
      }
      
      return NextResponse.json(
        { error: 'Database connection failed. Please try again later.' },
        { status: 503 } // Service Unavailable
      );
    }

    const dbName = process.env.MONGODB_DB_NAME as string;
    const db = client.db(dbName);
    const payments = db.collection('payments');

    // Find payment by paymentId
    const payment = await payments.findOne({ paymentId });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Only allow access to pending payments
    if (payment.state !== 'pending') {
      return NextResponse.json(
        { error: 'Payment is not pending' },
        { status: 400 }
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
        name: payment.name,
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

// POST: Process payment and update status
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> | { paymentId: string } }
) {
  try {
    // Handle both Promise and direct params (for Next.js 13+ compatibility)
    const resolvedParams = params instanceof Promise ? await params : params;
    const { paymentId } = resolvedParams;
    const body = await request.json();
    const { status, email } = body;

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    if (!status || !['completed', 'failed', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be completed, failed, or cancelled' },
        { status: 400 }
      );
    }
    
    // Connect to MongoDB with timeout
    let client;
    try {
      // Add timeout wrapper to prevent long waits
      const connectionPromise = clientPromise;
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Database connection timeout')), 10000); // 10 second timeout
      });
      
      client = await Promise.race([connectionPromise, timeoutPromise]) as Awaited<typeof clientPromise>;
    } catch (dbError: unknown) {
      console.error('MongoDB connection error:', dbError);
      const errorMessage = (dbError as Error)?.message || 'Database connection failed';
      
      // Check if it's a timeout or connection error
      if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEOUT')) {
        return NextResponse.json(
          { error: 'Database connection timeout. Please check your internet connection and try again.' },
          { status: 503 } // Service Unavailable
        );
      }
      
      return NextResponse.json(
        { error: 'Database connection failed. Please try again later.' },
        { status: 503 } // Service Unavailable
      );
    }

    const dbName = process.env.MONGODB_DB_NAME as string;
    const db = client.db(dbName);
    const payments = db.collection('payments');

    // Find payment by paymentId
    const payment = await payments.findOne({ paymentId });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Only allow updating pending payments
    if (payment.state !== 'pending') {
      return NextResponse.json(
        { error: 'Payment is not pending' },
        { status: 400 }
      );
    }

    // Update payment status
    const updateData: { state: string; email?: string } = { state: status };
    if (email) {
      updateData.email = email;
    }

    await payments.updateOne(
      { paymentId },
      { $set: updateData }
    );

    return NextResponse.json({
      message: 'Payment status updated successfully',
      paymentId,
      status
    }, { status: 200 });
  } catch (error) {
    console.error('Update payment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

