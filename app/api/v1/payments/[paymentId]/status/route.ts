import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const { paymentId } = await params;
    const body = await request.json();
    const { status } = body;

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    if (!status || !['completed', 'failed', 'paid'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be completed, paid, or failed' },
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

    // Update payment status
    const result = await payments.updateOne(
      { paymentId: paymentId },
      { 
        $set: { 
          state: status,
          updatedAt: new Date()
        } 
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Fetch the updated payment to get success_url
    const updatedPayment = await payments.findOne(
      { paymentId: paymentId },
      { projection: { success_url: 1 } }
    );

    return NextResponse.json({
      message: 'Payment status updated successfully',
      status: status,
      success_url: updatedPayment?.success_url as string,
    }, { status: 200 });
  } catch (error) {
    console.error('Update payment status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

