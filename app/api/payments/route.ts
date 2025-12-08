import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import { randomUUID } from 'crypto';
import { Payment } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
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
    const users = db.collection('users');
    const cart = db.collection('cart');

    // Get user with API key
    let user;
    try {
      user = await users.findOne(
        { _id: new ObjectId(session.userId) },
        { projection: { productionApiKey: 1, email: 1, username: 1 } }
      );
    } catch {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    if (!user || !user.productionApiKey) {
      return NextResponse.json(
        { error: 'User not found or API key not available' },
        { status: 404 }
      );
    }

    // Get cart items
    const cartItems = await cart.find({ userId: session.userId }).toArray();
    
    if (cartItems.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      );
    }

    // Calculate total amount in cents
    const total = cartItems.reduce((sum, item) => {
      return sum + (item.productPrice * item.quantity);
    }, 0);
    const amountInCents = Math.round(total * 100);

    // Get request body for additional payment details
    const body = await request.json().catch(() => ({}));
    const { metadata } = body;
    console.log(metadata);
    // Generate a unique payment id in UUID format
    const paymentId = randomUUID();

    // Prepare the payment data object
    const paymentData: Payment = {
      paymentId, // Add the unique payment id in the required format
      amount: amountInCents,
      currency: 'usd',
      email: user.email,
      name: user.username,
      description: `Order with ${cartItems.length} item(s)`,
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
      metadata: metadata.order_id,
      createdAt: new Date(),
      userId: session.userId,
      state: 'pending'
    };
    // Save paymentData in the database with the unique payment id
    const payments = db.collection('payments');
    await payments.insertOne(paymentData as unknown as Record<string, unknown>);

    // Delete all cart items for the current user after payment is created
    await cart.deleteMany({ userId: session.userId });

    return NextResponse.json(
      { message: 'Payment created successfully', paymentId: paymentId },
      { status: 200 }
    );
  } catch (error) {
    console.error('Create payment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}